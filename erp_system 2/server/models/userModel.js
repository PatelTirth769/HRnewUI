import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'hod', 'teacher', 'faculty', 'student'],
      default: 'student',
    },
    department: {
      type: String,
      required: function() {
        return this.role === 'hod' || this.role === 'teacher' || this.role === 'faculty';
      },
    },
    securityPin: {
      type: String,
      required: function() {
        return this.role === 'admin' || this.role === 'hod';
      },
      select: false,
    },
    isApproved: {
      type: Boolean,
      default: function() {
        // Admin is auto-approved, others need approval
        return this.role === 'admin';
      },
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvalToken: String,
    approvalTokenExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // Hash security pin if it exists and is modified
  if (this.securityPin && this.isModified('securityPin')) {
    this.securityPin = await bcrypt.hash(this.securityPin, salt);
  }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Match security pin
userSchema.methods.matchSecurityPin = async function (enteredPin) {
  return await bcrypt.compare(enteredPin, this.securityPin);
};

// Generate approval token
userSchema.methods.generateApprovalToken = function () {
  // Generate a random token
  const approvalToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to approvalToken field
  this.approvalToken = crypto
    .createHash('sha256')
    .update(approvalToken)
    .digest('hex');

  // Set expire
  this.approvalTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return approvalToken;
};

const User = mongoose.model('User', userSchema);

export default User;