import { NextResponse } from "next/server";
import { validateEnterpriseNumber, validateVATNumber } from "@/lib/vat";

export async function POST(request) {
  try {
    const { vatNumber, enterpriseNumber } = await request.json();

    // Organisations without VAT number: check the enterprise number (KBO)
    if (enterpriseNumber !== undefined) {
      if (typeof enterpriseNumber !== "string" || enterpriseNumber.length > 20) {
        return NextResponse.json({ status: "invalid" }, { status: 400 });
      }
      return NextResponse.json(await validateEnterpriseNumber(enterpriseNumber));
    }

    if (!vatNumber || typeof vatNumber !== "string" || vatNumber.length > 30) {
      return NextResponse.json(
        { status: "invalid", reason: "format" },
        { status: 400 }
      );
    }

    const result = await validateVATNumber(vatNumber);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error validating VAT number:", error);
    return NextResponse.json(
      { status: "unverified", peppol: null },
      { status: 500 }
    );
  }
}
