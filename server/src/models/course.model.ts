import { model, Schema } from "mongoose";

// Table blueprint
const CourseSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  // Disable the __v field
  { versionKey: false },
);

// The actual "table" in mongodb (Actually called collection in mongodb)
export const CourseModel = model("Course", CourseSchema);
