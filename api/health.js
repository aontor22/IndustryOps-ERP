export default function handler(_req, res) {
  res.status(200).json({ status: 'ok', service: 'IndustryOps API', timestamp: new Date().toISOString() })
}
