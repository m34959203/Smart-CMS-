#!/usr/bin/env node

/**
 * Fix media file URLs in the database
 * This script updates all media file URLs to use the correct domain with https://
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMediaUrls() {
  console.log('🔧 Starting media URL fix...\n');

  try {
    // Get all media files
    const mediaFiles = await prisma.mediaFile.findMany({
      select: {
        id: true,
        url: true,
        filename: true,
      },
    });

    console.log(`Found ${mediaFiles.length} media files to check\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const media of mediaFiles) {
      const oldUrl = media.url;
      let newUrl = oldUrl;
      let needsUpdate = false;

      // Fix URLs that are missing protocol
      if (!oldUrl.startsWith('http://') && !oldUrl.startsWith('https://')) {
        if (oldUrl.startsWith('/uploads/')) {
          newUrl = `https://aimak-api.onrender.com${oldUrl}`;
          needsUpdate = true;
        } else if (oldUrl.startsWith('aimak-api')) {
          newUrl = `https://${oldUrl}`;
          needsUpdate = true;
        }
      }

      // Fix URLs with incomplete domain (missing .onrender.com)
      if (newUrl.includes('aimak-api/') && !newUrl.includes('.onrender.com')) {
        newUrl = newUrl.replace('aimak-api/', 'aimak-api.onrender.com/');
        needsUpdate = true;
      }

      // Fix URLs with incorrect domain structure
      if (newUrl.match(/https?:\/\/aimak-api(?!\.onrender\.com)/)) {
        newUrl = newUrl.replace(/aimak-api(?!\.onrender\.com)/, 'aimak-api.onrender.com');
        needsUpdate = true;
      }

      // Ensure proper structure: https://aimak-api.onrender.com/uploads/filename
      if (!newUrl.match(/^https:\/\/aimak-api\.onrender\.com\/uploads\//)) {
        // Extract filename
        const filename = media.filename;
        newUrl = `https://aimak-api.onrender.com/uploads/${filename}`;
        needsUpdate = true;
      }

      if (needsUpdate && newUrl !== oldUrl) {
        await prisma.mediaFile.update({
          where: { id: media.id },
          data: { url: newUrl },
        });

        console.log(`✅ Fixed: ${media.filename}`);
        console.log(`   Old: ${oldUrl}`);
        console.log(`   New: ${newUrl}\n`);
        fixedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total files: ${mediaFiles.length}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Skipped (already correct): ${skippedCount}`);
    console.log('\n✅ Media URL fix completed successfully!');
  } catch (error) {
    console.error('❌ Error fixing media URLs:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixMediaUrls();
