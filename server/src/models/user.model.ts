import { model, Schema, type Types } from "mongoose";
import { DEFAULT_AVATAR, UPLOAD_DIR, USER_ROLES } from "@/utils/constants.ts";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: DEFAULT_AVATAR,
    },
  },
  { versionKey: false },
);

const UserModel = model("User", UserSchema);
type UserDocument = InstanceType<typeof UserModel>;

/** The public, password-free representation of a user in API responses. */
type SafeUser = {
  id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  avatar: string;
};

/**
 * Build the public, password-free representation of a user for API responses.
 * Never includes the password hash.
 *
 * @param {UserDocument} user - The Mongoose user document to serialize.
 * @returns {SafeUser} Public user with `id`, `name`, `email`, `role`, and `avatar` (URL).
 */
const toSafeUser = (user: UserDocument): SafeUser => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: `/${UPLOAD_DIR}/${user.avatar}`,
});

export { type SafeUser, toSafeUser, type UserDocument, UserModel };
