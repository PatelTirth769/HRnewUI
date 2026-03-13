const mongoose = require('mongoose');

const recruitmentSettingSchema = new mongoose.Schema({
    enforceStaffPlanning: { type: Boolean, default: false },
}, { timestamps: true });

// Always use a single document (singleton pattern)
recruitmentSettingSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({ enforceStaffPlanning: false });
    }
    return settings;
};

module.exports = mongoose.model('RecruitmentSetting', recruitmentSettingSchema);
