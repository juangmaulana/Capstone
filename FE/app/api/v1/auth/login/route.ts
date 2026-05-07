import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Find user by email
    const userRow = await db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email.trim().toLowerCase())
      .executeTakeFirst()

    if (!userRow) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, userRow.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Update last login
    await db.updateTable("users")
      .set({ last_login_at: new Date() })
      .where("id", "=", userRow.id)
      .execute()

    // Get role name
    const roleRow = await db
      .selectFrom("roles")
      .selectAll()
      .where("id", "=", userRow.role_id)
      .executeTakeFirst()

    return NextResponse.json({
      success: true,
      user: {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        role: roleRow?.name || "User",
      },
    })
  } catch (err) {
    console.error("Auth login error:", err)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
