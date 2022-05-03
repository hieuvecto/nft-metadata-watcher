// import { OpenBoxToRandomizeByRarity } from 'src/contracts/pool_mapping.json';

// export const openBoxToRandomizeByRarityPool = (
//   openBoxPoolId: number,
// ): number => {
//   const randomizePoolId = OpenBoxToRandomizeByRarity[openBoxPoolId.toString()];
//   if (!randomizePoolId) {
//     throw new Error(
//       `randomizePoolId with openBoxPoolId=${openBoxPoolId} not found.`,
//     );
//   }

//   return randomizePoolId;
// };

// export const randomizeByRarityToOpenBoxPool = (
//   randomizePoolId: number,
// ): number => {
//   for (const openBoxPoolId in OpenBoxToRandomizeByRarity) {
//     if (OpenBoxToRandomizeByRarity[openBoxPoolId] === randomizePoolId) {
//       return parseInt(openBoxPoolId,;
//     }
//   }

//   throw new Error(
//     `openBoxPoolId with randomizePoolId=${randomizePoolId} not found.`,
//   );
// };
