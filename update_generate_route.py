from pathlib import Path
import re

path = Path("app/api/images/generate/route.ts")
text = path.read_text()

if "master-admin" not in text:
    text = text.replace(
        "import { auth } from \"@/lib/auth\";\nimport { db } from \"@/lib/db\";\n",
        "import { auth } from \"@/lib/auth\";\nimport { db } from \"@/lib/db\";\nimport { hasAdminAccess, isMasterAdminEmail } from \"@/lib/master-admin\";\n",
    )

# ensure user select includes extra fields
text = text.replace(
    ".select({ credits: user.credits })\n",
    ".select({ credits: user.credits, isAdmin: user.isAdmin, email: user.email })\n",
)

# insert email const after userId assignment
text = text.replace(
    "const userId = session.user.id;\n\n    const dbUser = await db\n",
    "const userId = session.user.id;\n    const email = session.user.email ?? null;\n\n    const dbUser = await db\n",
)

# add admin promotion and master flag before credit check
pattern = r"  if \(!dbUser\) {\n    return NextResponse.json\({ error: \"User not found\" }, { status: 404 }\);\n  }\n\n"
replacement = (
    "  if (!dbUser) {\n    return NextResponse.json({ error: \"User not found\" }, { status: 404 });\n  }\n\n  let isAdmin = dbUser.isAdmin;\n  if (!isAdmin && hasAdminAccess(email)) {\n    await db.update(user).set({ isAdmin: true }).where(eq(user.id, userId));\n    isAdmin = true;\n  }\n\n  const isMasterAdmin = isMasterAdminEmail(email);\n\n"
)
text = re.sub(pattern, replacement, text, count=1)

# adjust credits check to respect master admin
text = text.replace(
    "    const cost = base64Images.length;\n\n    if (dbUser.credits < cost) {\n      return NextResponse.json({ error: INSUFFICIENT_CREDITS_MESSAGE }, { status: 402 });\n    }\n\n",
    "    const cost = base64Images.length;\n\n    if (!isMasterAdmin && dbUser.credits < cost) {\n      return NextResponse.json({ error: INSUFFICIENT_CREDITS_MESSAGE }, { status: 402 });\n    }\n\n",
)

# insert values mapping and adjust transaction block
values_pattern = r"    const { images, remainingCredits, totalGenerated } = await \(async \(\) => \{\n      try \{\n        return await db.transaction\(async \(tx\) => \{\n          const creditUpdate = await tx\n            .update\(user\)\n            .set\(\{ credits: sql`\$\{user.credits\} - \$\{cost\}` \}\)\n            .where\(and\(eq\(user.id, userId\), gte\(user.credits, cost\)\)\)\n            .returning\(\{ credits: user.credits \}\);\n\n          if \(creditUpdate.length === 0\) \{\n            throw INSUFFICIENT_CREDITS;\n          \}\n\n          const values = uploads.map\(\(upload\) => \(\{\n            id: upload.id,\n            userId,\n            prompt,\n            description: sanitizedDescription,\n            imagePath: upload.url,\n            model: PUBLIC_IMAGE_ENGINE_RESPONSE,\n            aspectRatio: body.aspectRatio ?? null,\n            seed: seedValue,\n            imageKitFileId: upload.fileId,\n            shareUrl: upload.shareUrl,\n            backgroundRemovedUrl: upload.backgroundRemovedUrl,\n            previewUrl: upload.previewUrl,\n          \}\)\);\n\n          const inserted = await tx.insert\(generatedImages\).values\(values\).returning\(\);\n\n          const totalRows = await tx\n            .select\(\{ total: sql<number>`count(*)` \}\)\n            .from\(generatedImages\)\n            .where\(eq\(generatedImages.userId, userId\)\);\n\n          const totalGenerated = totalRows.length > 0 ? Number(totalRows[0].total ?? values.length) : values.length;\n\n          return \{\n            images: inserted.map\((record) => \(\{\n              id: record.id,\n              prompt: record.prompt,\n              description: sanitizeModelMentions(record.description ?? null),\n              imagePath: record.imagePath,\n              model: PUBLIC_IMAGE_ENGINE_RESPONSE,\n              aspectRatio: record.aspectRatio,\n              seed: record.seed,\n              shareUrl: record.shareUrl,\n              backgroundRemovedUrl: record.backgroundRemovedUrl,\n              previewUrl: record.previewUrl,\n              createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),\n            \}\)\),\n            remainingCredits: creditUpdate[0].credits,\n            totalGenerated,\n          \};\n        \}\);\n      \} catch \(dbError\) \{\n        await Promise.all(\n          uploads.map\((item) => imageKit.deleteFile(item.fileId).catch(() => {})\),\n        );\n        throw dbError;\n      \}\n    \}\)\(\);\n"

values_replacement = (
    "    const values = uploads.map((upload) => ({\n      id: upload.id,\n      userId,\n      prompt,\n      description: sanitizedDescription,\n      imagePath: upload.url,\n      model: PUBLIC_IMAGE_ENGINE_RESPONSE,\n      aspectRatio: body.aspectRatio ?? null,\n      seed: seedValue,\n      imageKitFileId: upload.fileId,\n      shareUrl: upload.shareUrl,\n      backgroundRemovedUrl: upload.backgroundRemovedUrl,\n      previewUrl: upload.previewUrl,\n    }));\n\n    const { images, remainingCredits, totalGenerated } = await (async () => {\n      try {\n        if (isMasterAdmin) {\n          return await db.transaction(async (tx) => {\n            const inserted = await tx.insert(generatedImages).values(values).returning();\n\n            const totalRows = await tx\n              .select({ total: sql<number>`count(*)` })\n              .from(generatedImages)\n              .where(eq(generatedImages.userId, userId));\n\n            const totalGeneratedCount =\n              totalRows.length > 0 ? Number(totalRows[0].total ?? values.length) : values.length;\n\n          return {\n              images: inserted.map((record) => ({\n                id: record.id,\n                prompt: record.prompt,\n                description: sanitizeModelMentions(record.description ?? null),\n                imagePath: record.imagePath,\n                model: PUBLIC_IMAGE_ENGINE_RESPONSE,\n                aspectRatio: record.aspectRatio,\n                seed: record.seed,\n                shareUrl: record.shareUrl,\n                backgroundRemovedUrl: record.backgroundRemovedUrl,\n                previewUrl: record.previewUrl,\n                createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),\n              })),\n              remainingCredits: dbUser.credits,\n              totalGenerated: totalGeneratedCount,\n            };\n          });\n        }\n\n        return await db.transaction(async (tx) => {\n          const creditUpdate = await tx\n            .update(user)\n            .set({ credits: sql`${user.credits} - ${cost}` })\n            .where(and(eq(user.id, userId), gte(user.credits, cost)))\n            .returning({ credits: user.credits });\n\n          if (creditUpdate.length === 0) {\n            throw INSUFFICIENT_CREDITS;\n          }\n\n          const inserted = await tx.insert(generatedImages).values(values).returning();\n\n          const totalRows = await tx\n            .select({ total: sql<number>`count(*)` })\n            .from(generatedImages)\n            .where(eq(generatedImages.userId, userId));\n\n          const totalGenerated = totalRows.length > 0 ? Number(totalRows[0].total ?? values.length) : values.length;\n\n          return {\n            images: inserted.map((record) => ({\n              id: record.id,\n              prompt: record.prompt,\n              description: sanitizeModelMentions(record.description ?? null),\n              imagePath: record.imagePath,\n              model: PUBLIC_IMAGE_ENGINE_RESPONSE,\n              aspectRatio: record.aspectRatio,\n              seed: record.seed,\n              shareUrl: record.shareUrl,\n              backgroundRemovedUrl: record.backgroundRemovedUrl,\n              previewUrl: record.previewUrl,\n              createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),\n            })),\n            remainingCredits: creditUpdate[0].credits,\n            totalGenerated,\n          };\n        });\n      } catch (dbError) {\n        await Promise.all(\n          uploads.map((item) => imageKit.deleteFile(item.fileId).catch(() => {})),\n        );\n        throw dbError;\n      }\n    })();\n"
)

text = re.sub(values_pattern, values_replacement, text, count=1)

# ensure response includes hasUnlimitedCredits
text = text.replace(
    "      totalGenerated,\n    });\n  } catch (error) {\n",
    "      totalGenerated,\n      hasUnlimitedCredits: isMasterAdmin,\n    });\n  } catch (error) {\n",
)

path.write_text(text)
