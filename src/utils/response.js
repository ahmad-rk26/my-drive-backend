export const success = (res, data, message = "Success") => {
    res.json({ success: true, message, data });
};

export const failure = (res, message = "Error", status = 400) => {
    res.status(status).json({ success: false, message });
};
