/*
  Warnings:

  - Added the required column `recentSummonerIds` to the `Summoner` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Summoner` ADD COLUMN `recentSummonerIds` VARCHAR(191) NOT NULL;
