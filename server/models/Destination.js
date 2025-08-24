const mongoose = require("mongoose");

const DestinationSchema = new mongoose.Schema({
  name: {
    en: {
      type: String,
      required: [true, "Please add an English destination name"],
      trim: true,
    },
    ar: {
      type: String,
      required: [true, "Please add an Arabic destination name"],
      trim: true,
    }
  },
  country: {
    en: {
      type: String,
      required: [true, "Please add an English country name"],
      trim: true,
    },
    ar: {
      type: String,
      required: [true, "Please add an Arabic country name"],
      trim: true,
    }
  },
  description: {
    en: {
      type: String,
      required: [true, "Please add an English description"],
    },
    ar: {
      type: String,
      required: [true, "Please add an Arabic description"],
    }
  },
  rating: {
    type: Number,
    required: [true, "Please add a rating"],
    min: 0,
    max: 5,
  },
  image: {
    type: String,
    required: [true, "Please add an image URL"],
  },
  topAttractions: {
    en: [{
      type: String,
      required: [true, "Please add English top attractions"],
    }],
    ar: [{
      type: String,
      required: [true, "Please add Arabic top attractions"],
    }]
  },
  localCuisine: {
    en: [{
      type: String,
      required: [true, "Please add English local cuisine"],
    }],
    ar: [{
      type: String,
      required: [true, "Please add Arabic local cuisine"],
    }]
  },
  shopping: {
    en: [{
      type: String,
      required: [true, "Please add English shopping locations"],
    }],
    ar: [{
      type: String,
      required: [true, "Please add Arabic shopping locations"],
    }]
  },
  bestTimeToVisit: {
    en: {
      type: String,
      required: [true, "Please add English best time to visit"],
    },
    ar: {
      type: String,
      required: [true, "Please add Arabic best time to visit"],
    }
  },
  quickInfo: {
    airport: {
      en: {
        type: String,
        required: [true, "Please add English airport name"],
      },
      ar: {
        type: String,
        required: [true, "Please add Arabic airport name"],
      }
    },
    timeZone: {
      en: {
        type: String,
        required: [true, "Please add English time zone"],
      },
      ar: {
        type: String,
        required: [true, "Please add Arabic time zone"],
      }
    },
  },
  popular: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update `updatedAt` field on save
DestinationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Destination", DestinationSchema);
