import { NextResponse } from "next/server";
import { validateVATNumber } from "@/lib/vat";

export async function POST(request) {
  try {
    const { vatNumber } = await request.json();

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
