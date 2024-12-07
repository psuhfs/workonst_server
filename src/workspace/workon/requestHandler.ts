import {Router} from "../../http/router.ts";
import {RequestType} from "../../http/requestType.ts";
import {handleGetEmployee, handleGetEmployees} from "./getHandlers.ts";
import {handleIncr, handleShift, handleShifts} from "./postHandlers.ts";

const router = new Router("/workon");

router
    .add(RequestType.GET, "/employees", handleGetEmployees, {
        description: "Caches and returns list of all employees.",
    })
    .add(RequestType.GET, "/employee/:id", handleGetEmployee, {
        description: "Caches and returns employee detail of given employee ID",
        usage: "GET request on /employee/<employee ID>",
    })
    .add(RequestType.POST, "/incr", handleIncr, {
        description: "Gives a point to an employee for specific shift.",
        usage: "Expects the body in JSON format which can be serialized to /../src/utils/PointsDetails interface."
    })
    .add(RequestType.POST, "/shifts", handleShifts, {
        description: "Caches and returns list all shifts of all employees"
    })
    .add(RequestType.POST, "/employee/:id/shifts", handleShift, {
        description: "Caches and returns list all shifts of the given employee"
    });

export default {
    handle: async (req: Request) => {
        return await router.handle(req);
    },
};
