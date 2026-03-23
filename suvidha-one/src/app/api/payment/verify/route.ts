import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentId, signature } = await request.json();

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, paymentId, signature" },
        { status: 400 }
      );
    }

    // Call backend payment service to verify and complete payment
    const backendResponse = await fetch(`${API_BASE_URL}/payment/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error("Backend payment verification error:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Payment verification failed" },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();

    return NextResponse.json(
      {
        success: result.success,
        message: "Payment verified successfully",
        orderId,
        paymentId,
        payment_id: result.payment_id,
        receipt: result.receipt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
