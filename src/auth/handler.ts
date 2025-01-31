import type { CustomResponse } from "../http/response.ts";
import {
  internalServerError,
  success,
  unauthorized,
} from "../http/responseTemplates.ts";
import jwt from "jsonwebtoken";
import type { Token } from "./model.ts";
import { prisma } from "../handler/db.ts";
import { sha256Hash } from "./hasher.ts";
import type { RequestHandler } from "../http/traits.ts";

interface SignupDetails {
  emailid?: string;
  token: string;
}

interface AuthModel {
  username: string;
  password: string;
  signupDetails?: SignupDetails;
}

// TODO: should maintain a map
export async function handleAuth(req: Request): Promise<CustomResponse> {
  try {
    let token = req.headers.get("Authorization");
    if (token === null) {
      return unauthorized("No token provided.");
    }
    token = token.replace("Bearer ", "");
    return await processAuth({ token });
  } catch (e: any) {
    return internalServerError("Unable to process auth request.", e.toString());
  }
}

export async function handleAuthSignin(req: Request): Promise<CustomResponse> {
  try {
    let body: AuthModel = await req.json();
    return await processAuthSignin(body);
  } catch (e: any) {
    return internalServerError(
      "Unable to process auth signin request.",
      e.toString(),
    );
  }
}

export class SignUpHandler implements RequestHandler {
  async handle(
    req: Request,
    _params: Record<string, string>,
  ): Promise<CustomResponse> {
    return handleAuthSignup(req);
  }

  async auth(_: Request): Promise<CustomResponse> {
    return success("Blah");
  }
}

export class SignInHandler implements RequestHandler {
  async handle(
    req: Request,
    _params: Record<string, string>,
  ): Promise<CustomResponse> {
    return handleAuthSignin(req);
  }

  async auth(_: Request): Promise<CustomResponse> {
    return success("Blah");
  }
}

export async function handleAuthSignup(req: Request): Promise<CustomResponse> {
  try {
    let body: AuthModel = await req.json();
    return await processAuthSignup(body);
  } catch (e: any) {
    return internalServerError(
      "Unable to process auth signup request.",
      e.toString(),
    );
  }
}

async function processAuth(body: Token): Promise<CustomResponse> {
  if (verifyToken(body)) {
    return success({
      message: "Auth Successful.",
    });
  } else {
    return unauthorized();
  }
}

async function processAuthSignin(body: AuthModel): Promise<CustomResponse> {
  body.password = sha256Hash(body.password);

  let val = await prisma.crew_leaders.findUnique({
    where: {
      username: body.username,
      password: body.password,
    },
  });

  if (val === null) {
    return unauthorized("Invalid username or password.");
  }

  return success(genToken(body));
}

async function processAuthSignup(body: AuthModel): Promise<CustomResponse> {
  if (body.signupDetails === undefined) {
    return unauthorized("No signup details provided.");
  }
  let token = body.signupDetails.token;

  let details = extractTokenDetails({ token });

  if (details === undefined) {
    return unauthorized("Invalid signup details.");
  }
  let referer: string = details["username"];
  let val = await prisma.crew_leaders.findUnique({
    where: {
      username: referer,
    },
  });

  if (val === null) {
    return unauthorized("Invalid signup details.");
  }

  await prisma.crew_leaders.create({
    data: {
      username: body.username,
      password: sha256Hash(body.password),
      emailid: body.signupDetails.emailid
        ? body.signupDetails.emailid
        : `${body.username}@psu.edu`,
    },
  });

  return success({ message: "Signup successful." });
}

function genToken(body: AuthModel): Token {
  return {
    token: jwt.sign(
      { pw: body.password, username: body.username },
      process.env.JWT,
      { expiresIn: "10h" },
    ),
  };
}

export function extractTokenDetails(token: Token): any {
  try {
    return jwt.verify(token.token, process.env.JWT);
  } catch (e) {
    return undefined;
  }
}

function verifyToken(token: Token): boolean {
  try {
    return !!extractTokenDetails(token);
  } catch (e) {
    return false;
  }
}
