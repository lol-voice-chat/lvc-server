-- CreateTable
CREATE TABLE `Chat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` VARCHAR(191) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fk_summoner_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Summoner` (
    `summonerId` INTEGER NOT NULL,
    `gameName` VARCHAR(191) NOT NULL,
    `gameTag` VARCHAR(191) NOT NULL,
    `id` VARCHAR(191) NOT NULL,
    `pid` VARCHAR(191) NOT NULL,
    `puuid` VARCHAR(191) NOT NULL,
    `profileImage` VARCHAR(191) NOT NULL,
    `tier` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`summonerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_fk_summoner_id_fkey` FOREIGN KEY (`fk_summoner_id`) REFERENCES `Summoner`(`summonerId`) ON DELETE RESTRICT ON UPDATE CASCADE;
