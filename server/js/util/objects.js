let Objects = {};

Objects.Data = {};

Objects.getObject = (id) => {
    if (id in Objects.Data)
        return Objects.Data[id];

    return null;
};

module.exports = Objects;
