const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: { nextId },
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function list(req, res, next) {
  res.json({ data: orders });
}

function update(req, res, next) {
  const orderId = res.locals.orderId;
  const {
    data: { id, deliverTo, mobileNumber, dishes, status } = {},
  } = req.body;

  if (id && orderId !== id) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${orderId}`,
    });
  } else if (!status || status === "invalid") {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  } else if (status === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }

  const newOrder = {
    id: orderId,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
    status: status,
  };

  res.json({ data: newOrder });
}

function destroy(req, res, next) {
  const order = res.locals.order;
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === Number(orderId));
  if (order.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  if (index > -1) {
    orders.splice(index, 1);
    res.sendStatus(204);
  }
  res.sendStatus(204);
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.orderId = orderId;
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`,
  });
}

function validateOrder(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes, quantity } = {} } = req.body;
  if (!deliverTo || deliverTo === "") {
    next({
      status: 400,
      message: "Order must include a deliverTo",
    });
  }
  if (!mobileNumber || mobileNumber === "") {
    next({
      status: 400,
      message: "Order must include a mobileNumber",
    });
  }
  if (!dishes) {
    next({
      status: 400,
      message: "Order must include a dish",
    });
  }
  if (!dishes.length || !Array.isArray(dishes)) {
    next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
  for (index in dishes) {
    const dish = dishes[index];
    const { quantity } = dish;
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

module.exports = {
  list,
  create: [validateOrder, create],
  read: [orderExists, read],
  delete: [orderExists, destroy],
  update: [orderExists, validateOrder, update],
};
