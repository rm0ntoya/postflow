import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Carousel from "@/models/Carousel";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    await connectDB();

    // Project BEFORE sort — strips huge base64 images so sort stays under MongoDB 32MB limit
    const carousels = await Carousel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(session.userId) } },
      {
        $project: {
          title: 1,
          theme: 1,
          status: 1,
          accent: 1,
          accentColor: 1,
          viral: 1,
          imageSlides: 1,
          fontPair: 1,
          createdAt: 1,
          updatedAt: 1,
          slides: {
            $map: {
              input: "$slides",
              as: "s",
              in: {
                id: "$$s.id",
                bgKey: "$$s.bgKey",
                bgOverride: "$$s.bgOverride",
                bgImageUrl: {
                  $cond: [
                    { $gt: [{ $strLenCP: { $ifNull: ["$$s.bgThumbUrl", ""] } }, 0] },
                    "$$s.bgThumbUrl",
                    { $cond: [
                      { $gt: [{ $strLenCP: { $ifNull: ["$$s.bgImageUrl", ""] } }, 0] },
                      "__has_image__",
                      "$$REMOVE",
                    ]},
                  ],
                },
                elements: {
                  $map: {
                    input: "$$s.elements",
                    as: "e",
                    in: {
                      id: "$$e.id",
                      type: "$$e.type",
                      text: "$$e.text",
                      segments: "$$e.segments",
                      x: "$$e.x",
                      y: "$$e.y",
                      w: "$$e.w",
                      h: "$$e.h",
                      fontSize: "$$e.fontSize",
                      weight: "$$e.weight",
                      color: "$$e.color",
                      font: "$$e.font",
                      align: "$$e.align",
                      lineHeight: "$$e.lineHeight",
                      letterSpacing: "$$e.letterSpacing",
                      shape: "$$e.shape",
                      radius: "$$e.radius",
                      opacity: "$$e.opacity",
                      photoUrl: {
                        $cond: [{ $eq: ["$$e.type", "profile"] }, "$$e.photoUrl", "$$REMOVE"],
                      },
                      hasImage: {
                        $cond: [
                          { $gt: [{ $strLenCP: { $ifNull: ["$$e.imageUrl", ""] } }, 0] },
                          true,
                          "$$REMOVE",
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      { $sort: { updatedAt: -1 } },
    ]);

    return NextResponse.json({ carousels });
  } catch (error: any) {
    console.error("[API Carousel GET] Erro:", error);
    return NextResponse.json({ error: error.message || "Erro interno." }, { status: 500 });
  }
}
