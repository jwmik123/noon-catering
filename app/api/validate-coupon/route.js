import { client } from "@/sanity/lib/client";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "Geen kortingscode opgegeven." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const coupon = await client.fetch(
      `*[_type == "coupon" && code == $code && active == true && expiresAt > $now][0]{
        code,
        discountType,
        discountValue,
        description
      }`,
      { code: code.toUpperCase().trim(), now }
    );

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        error: "Ongeldige of verlopen kortingscode.",
      });
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      description: coupon.description || null,
    });
  } catch (error) {
    console.error("Coupon validation failed:", error);
    return NextResponse.json(
      { valid: false, error: "Kon kortingscode niet valideren." },
      { status: 500 }
    );
  }
}
