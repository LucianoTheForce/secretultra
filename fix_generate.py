from pathlib import Path
import re

path = Path('app/api/images/generate/route.ts')
text = path.read_text()

# ensure email declaration
if 'const email = session.user.email ?? null;' not in text:
    text = text.replace(
        '    const userId = session.user.id;\n',
        '    const userId = session.user.id;\n    const email = session.user.email ?? null;\n\n',
    )

# update select fields
text, _ = re.subn(
    r"const dbUser = await db\s*\n\s*\.select\({ credits: user\.credits }\)",
    "const dbUser = await db\n      .select({ credits: user.credits, isAdmin: user.isAdmin, email: user.email })",
    text,
    count=1,
)

# admin promotion block
text = text.replace(
    '    if (!dbUser) {\n      return NextResponse.json({ error: "User not found" }, { status: 404 });\n    }\n\n',
    '    if (!dbUser) {\n      return NextResponse.json({ error: "User not found" }, { status: 404 });\n    }\n\n    if (!dbUser.isAdmin && hasAdminAccess(email)) {\n      await db.update(user).set({ isAdmin: true }).where(eq(user.id, userId));\n      dbUser = { ...dbUser, isAdmin: true };\n    }\n\n    const isMasterAdmin = isMasterAdminEmail(email);\n\n',
    1,
)

# adjust credits check
text = text.replace(
    '    if (dbUser.credits < cost) {\n',
    '    if (!isMasterAdmin && dbUser.credits < cost) {\n',
)

old_block = """    const { images, remainingCredits, totalGenerated } = await (async () => {\n      try {\n        return await db.transaction(async (tx) => {\n          const creditUpdate = await tx\n            .update(user)\n            .set({ credits: sql${user.credits} -  })\n            .where(and(eq(user.id, userId), gte(user.credits, cost)))\n            .returning({ credits: user.credits });\n\n          if (creditUpdate.length === 0) {\n            throw INSUFFICIENT_CREDITS;\n          }\n\n          const values = uploads.map((upload) => ({\n            id: upload.id,\n            userId,\n            prompt,\n            description: sanitizedDescription,\n            imagePath: upload.url,\n            model: PUBLIC_IMAGE_ENGINE_RESPONSE,\n            aspectRatio: body.aspectRatio ?? null,\n            seed: seedValue,\n            imageKitFileId: upload.fileId,\n            shareUrl: upload.shareUrl,\n            backgroundRemovedUrl: upload.backgroundRemovedUrl,\n            previewUrl: upload.previewUrl,\n          }));\n\n          const inserted = await tx.insert(generatedImages).values(values).returning();\n\n          const totalRows = await tx\n            .select({ total: sql<number>count(*) })\n            .from(generatedImages)\n            .where(eq(generatedImages.userId, userId));\n\n          const totalGenerated = totalRows.length > 0 ? Number(totalRows[0].total ?? values.length) : values.length;\n\n          return {\n            images: inserted.map((record) => ({\n              id: record.id,\n              prompt: record.prompt,\n              description: sanitizeModelMentions(record.description ?? null),\n              imagePath: record.imagePath,\n              model: PUBLIC_IMAGE_ENGINE_RESPONSE,\n              aspectRatio: record.aspectRatio,\n              seed: record.seed,\n              shareUrl: record.shareUrl,\n              backgroundRemovedUrl: record.backgroundRemovedUrl,\n              previewUrl: record.previewUrl,\n              createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),\n            })),\n            remainingCredits: creditUpdate[0].credits,\n            totalGenerated,\n          };\n        });\n      } catch (dbError) {\n        await Promise.all(\n          uploads.map((item) => imageKit.deleteFile(item.fileId).catch(() => {})),\n        );\n        throw dbError;\n      }\n    })();\n\n    return NextResponse.json({\n      images,\n      description: sanitizedDescription,\n      model: PUBLIC_IMAGE_ENGINE_RESPONSE,\n      credits: remainingCredits,\n      totalGenerated,\n    });\n"""

new_block = """    const values = uploads.map((upload) => ({\n      id: upload.id,\n      userId,\n      prompt,\n      description: sanitizedDescription,\n      imagePath: upload.url,\n      model: PUBLIC_IMAGE_ENGINE_RESPONSE,\n      aspectRatio: body.aspectRatio ?? null,\n      seed: seedValue,\n      imageKitFileId: upload.fileId,\n      shareUrl: upload.shareUrl,\n      backgroundRemovedUrl: upload.backgroundRemovedUrl,\n      previewUrl: upload.previewUrl,\n    }));\n\n    const { images, remainingCredits, totalGenerated } = await (async () => {\n      try {\n        if (isMasterAdmin) {\n          return await db.transaction(async (tx) => {\n            const inserted = await tx.insert(generatedImages).values(values).returning();\n\n            const totalRows = await tx\n              .select({ total: sql<number>count(*) })\n              .from(generatedImages)\n              .where(eq(generatedImages.userId, userId));\n\n            const totalGeneratedCount =\n              totalRows.length > 0 ? Number(totalRows[0].total ?? values.length) : values.length;\n\n            return {\n              images: inserted.map((record) => ({\n                id: record.id,\n                prompt: record.prompt,\n                description: sanitizeModelMentions(record.description ?? null),\n                imagePath: record.imagePath,\n                model: PUBLIC_IMAGE_ENGINE_RESPONSE,\n                aspectRatio: record.aspectRatio,\n                seed: record.seed,\n                shareUrl: record.shareUrl,\n                backgroundRemovedUrl: record.backgroundRemovedUrl,\n                previewUrl: record.previewUrl,\n                createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),\n              })),\n              remainingCredits: dbUser.credits,\n              totalGenerated: totalGeneratedCount,\n            };\n          });\n        }\n\n        return await db.transaction(async (tx) => {\n          const creditUpdate = await tx\n            .update(user)\n            .set({ credits: sql${user.credits} -  })\n            .where(and(eq(user.id, userId), gte(user.credits, cost)))\n            .returning({ credits: user.credits });\n\n          if (creditUpdate.length === 0) {\n            throw INSUFFICIENT_CREDITS;\n          }\n\n          const inserted = await tx.insert(generatedImages).values(values).returning();\n\n          const totalRows = await tx\n            .select({ total: sql<number>count(*) })\n            .from(generatedImages)\n            .where(eq(generatedImages.userId, userId));\n\n          const totalGenerated = totalRows.length > 0 ? Number(totalRows[0].total ?? values.length) : values.length;\n\n          return {\n            images: inserted.map((record) => ({\n              id: record.id,\n              prompt: record.prompt,\n              description: sanitizeModelMentions(record.description ?? null),\n              imagePath: record.imagePath,\n              model: PUBLIC_IMAGE_ENGINE_RESPONSE,\n              aspectRatio: record.aspectRatio,\n              seed: record.seed,\n              shareUrl: record.shareUrl,\n              backgroundRemovedUrl: record.backgroundRemovedUrl,\n              previewUrl: record.previewUrl,\n              createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),\n            })),\n            remainingCredits: creditUpdate[0].credits,\n            totalGenerated,\n          };\n        });\n      } catch (dbError) {\n        await Promise.all(\n          uploads.map((item) => imageKit.deleteFile(item.fileId).catch(() => {})),\n        );\n        throw dbError;\n      }\n    })();\n\n    return NextResponse.json({\n      images,\n      description: sanitizedDescription,\n      model: PUBLIC_IMAGE_ENGINE_RESPONSE,\n      credits: remainingCredits,\n      totalGenerated,\n      hasUnlimitedCredits: isMasterAdmin,\n    });\n"""

if old_block not in text:
    raise SystemExit('old block not found')
text = text.replace(old_block, new_block)
path.write_text(text)
