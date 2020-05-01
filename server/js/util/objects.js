let Objects = {};

Objects.Data = {};

Objects.getObject = (id) => {
    if (id in Objects.Data)
        return Objects.Data[id];

    return null;
};

Objects.getPosition = (id) => {
    let info = id.split('-');

    return {
        x: parseInt(info[0]),
        y: parseInt(info[1])
    }
};

Objects.getCursor = (id) => {
    if (id in Objects.Data)
        if (Objects.Data[id].cursor)
            return Objects.Data[id].cursor;

    return null;
};

module.exports = Objects;
