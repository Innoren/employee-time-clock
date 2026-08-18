import { NextRequest, NextResponse } from "next/server";
import { parseSessionToken, SESSION_COOKIE } from "@/lib/session";

function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await parseSessionToken(token) : null;

  if (pathname.startsWith("/pin")) {
    if (!session) {
      const login = new URL("/login", request.url);
      const response = NextResponse.redirect(login);
      if (token) clearSessionCookie(response);
      return response;
    }
    if (!session.mustChangePin) {
      return NextResponse.redirect(new URL("/clock", request.url));
    }
    return NextResponse.next();
  }

  if ((pathname.startsWith("/clock") || pathname.startsWith("/admin")) && !session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    const response = NextResponse.redirect(login);
    if (token) clearSessionCookie(response);
    return response;
  }

  if ((pathname.startsWith("/clock") || pathname.startsWith("/admin")) && session?.mustChangePin) {
    return NextResponse.redirect(new URL("/pin", request.url));
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(
      new URL(session.mustChangePin ? "/pin" : "/clock", request.url),
    );
  }

  if (pathname === "/login" && token && !session) {
    return clearSessionCookie(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/clock/:path*", "/admin/:path*", "/login", "/pin"],
};
