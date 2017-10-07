module.exports = (res, reason, message, code) => {
    console.log(`ERROR: ${reason}`);
    return res.status(code || 500).json({ 'errors': message });
};
