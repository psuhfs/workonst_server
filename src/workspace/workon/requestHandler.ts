import { Router } from "../../http/router.ts";
import { RequestType } from "../../http/requestType.ts";
import { GetEmployee, GetEmployees } from "./getHandlers.ts";
import { IncrHandler, ShiftHandler, ShiftsHandler } from "./postHandlers.ts";

const router = new Router("/workon");

router
  .add(RequestType.GET, "/employees", new GetEmployees(), {
    description: "Caches and returns list of all employees.",
  })
  .add(RequestType.GET, "/employee/:id", new GetEmployee(), {
    description: "Caches and returns employee detail of given employee ID",
    usage: "GET request on /employee/<employee ID>",
  })
  .add(RequestType.POST, "/incr", new IncrHandler(), {
    description: "Gives a point to an employee for specific shift.",
    usage:
      "Expects the body in JSON format which can be serialized to /../src/utils/PointsDetails interface. And it should have a header 'Authorization': 'Bearer <JWT>'.",
  })
  .add(RequestType.POST, "/shifts", new ShiftsHandler(), {
    description: "Caches and returns list all shifts of all employees",
  })
  .add(RequestType.POST, "/employee/:id/shifts", new ShiftHandler(), {
    description: "Caches and returns list all shifts of the given employee",
  });

export default {
  handle: async (req: Request) => {
    return await router.handle(req);
  },
};
