import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  stripePaymentId: string;
  planType: "pro" | "studio";
  amountBRL: number;
  status: "approved" | "pending" | "rejected" | "cancelled";
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stripePaymentId: { type: String, required: true, unique: true },
    planType: { type: String, enum: ["pro", "studio"], required: true },
    amountBRL: { type: Number, required: true },
    status: { type: String, enum: ["approved", "pending", "rejected", "cancelled"], required: true },
  },
  { timestamps: true }
);

const Payment: Model<IPayment> =
  mongoose.models.Payment ?? mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
