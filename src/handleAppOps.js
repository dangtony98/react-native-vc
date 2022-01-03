const reformatSearchPayload = (payload) => {
    console.log('reformatSearchPayload');
    console.log(payload);

    // TODO: preprocess
    return payload.join(' ');
}

export { reformatSearchPayload };