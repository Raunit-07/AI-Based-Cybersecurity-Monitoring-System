import mongoose from "mongoose";

const organizationSchema =
    new mongoose.Schema(
        {
            // ================= NAME =================
            name: {
                type: String,

                required: true,

                trim: true,

                minlength: 2,

                maxlength: 100,
            },

            // ================= OWNER =================
            owner: {
                type:
                    mongoose.Schema.Types
                        .ObjectId,

                ref: "User",

                required: true,

                index: true,
            },

            // ================= PLAN =================
            plan: {
                type: String,

                enum: [
                    "free",
                    "pro",
                    "enterprise",
                ],

                default: "free",
            },

            // ================= API KEY =================
            apiKey: {
                type: String,

                required: true,

                unique: true,

                index: true,
            },

            // ================= DEVICES =================
            devices: [
                {
                    type:
                        mongoose.Schema.Types
                            .ObjectId,

                    ref: "Device",
                },
            ],

            // ================= ACTIVE =================
            isActive: {
                type: Boolean,

                default: true,
            },
        },

        {
            timestamps: true,

            versionKey: false,
        }
    );

// ================= INDEXES =================
organizationSchema.index({
    owner: 1,
});

organizationSchema.index({
    apiKey: 1,
});

// ================= SAFE EXPORT =================
const Organization =
    mongoose.models.Organization ||
    mongoose.model(
        "Organization",
        organizationSchema
    );

export default Organization;