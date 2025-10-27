import { seedCategories } from "./categories.seed";
import { seedAdminUser } from "./admin-user.seed";

export const runSeeds = async (): Promise<void> => {
  await seedCategories();
  await seedAdminUser();
};

if (process.argv[1]?.includes("seeds/index")) {
  runSeeds().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
