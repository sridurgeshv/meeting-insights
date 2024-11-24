const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  summary: String,
  transcript: String,
  actionItems: [String],
  decisions: [String],
  questions: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Meeting', meetingSchema);