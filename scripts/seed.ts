import { randomBytes } from "node:crypto";
import { getDb } from "../src/db/client";
import { unitMedia, users, type Role } from "../src/db/schema";
import { hashPassword } from "../src/server/auth";
import { saveSeedSvg } from "../src/server/media";
import { addMedia, createUnit, publishUnit, type UnitInput } from "../src/server/units";

// Development data only. Every record is invented and marked SAMPLE, so none of it may reach production.
if (process.env.NODE_ENV === "production") throw new Error("The seed script must not run in production");

const staff: { email: string; name: string; role: Role }[] = [
  { email: "admin@adot.test", name: "Sample Administrator", role: "administrator" },
  { email: "leasing@adot.test", name: "Sample Leasing", role: "leasing_staff" },
  { email: "editor@adot.test", name: "Sample Editor", role: "content_editor" },
];

const sampleUnits: UnitInput[] = [
  {
    reference: "SAMPLE-G01",
    floor: "Ground",
    category: "Retail",
    areaM2: 85,
    titleEn: "SAMPLE Ground floor retail unit",
    titleAm: "ናሙና የመሬት ወለል የንግድ ክፍል",
    descriptionEn: "Sample listing for development. Not a real unit.",
    descriptionAm: "ለሙከራ የተዘጋጀ ናሙና። እውነተኛ ክፍል አይደለም።",
    featuresEn: ["Street frontage", "Storage room"],
    featuresAm: ["የመንገድ ፊት", "የዕቃ ማከማቻ ክፍል"],
  },
  {
    reference: "SAMPLE-F12",
    floor: "First",
    category: "Office",
    areaM2: 140,
    titleEn: "SAMPLE First floor office",
    descriptionEn: "Sample listing with public rent and no Amharic translation, to show the English fallback.",
    rentEtb: 90000,
    billingPeriod: "monthly",
    rentPublic: true,
  },
];

const placeholder = (label: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#22262a"/>
  <text x="400" y="290" fill="#b99552" font-family="sans-serif" font-size="36" text-anchor="middle">Placeholder image</text>
  <text x="400" y="340" fill="#f5f2eb" font-family="sans-serif" font-size="24" text-anchor="middle">${label}</text>
</svg>`;

async function main() {
  const db = await getDb();
  if ((await db.select({ id: users.id }).from(users).limit(1)).length > 0) {
    console.log("Database already has users. Nothing was changed.");
    return;
  }

  const password = process.env.SEED_PASSWORD || randomBytes(9).toString("base64url");
  const passwordHash = await hashPassword(password);
  const created = await db
    .insert(users)
    .values(staff.map((member) => ({ ...member, passwordHash })))
    .returning();
  const admin = created.find((user) => user.role === "administrator")!;

  for (const input of sampleUnits) {
    const unit = await createUnit(db, admin, input);
    const fileName = await saveSeedSvg(placeholder(input.reference));
    await addMedia(db, admin, unit.id, { fileName, altEn: "Placeholder image", altAm: "ምሳሌ ምስል" });
    await publishUnit(db, admin, unit.id);
  }

  console.log(`Seeded ${(await db.select().from(unitMedia)).length} sample units.`);
  console.log(`Sign in at /admin/login with ${staff.map((s) => s.email).join(", ")}`);
  console.log(`Password: ${password}`);
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
