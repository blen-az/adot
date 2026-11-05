import { requireUser } from "@/lib/session";
import { assertCan } from "@/server/permissions";
import { UnitForm } from "../UnitForm";

export default async function NewUnitPage() {
  assertCan(await requireUser(), "units.edit");
  return (
    <>
      <h1>New unit</h1>
      <UnitForm initial={{}} />
    </>
  );
}
