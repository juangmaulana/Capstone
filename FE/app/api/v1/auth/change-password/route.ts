import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, currentPassword, newPassword } = await req.json()

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Email, current password, and new password are required" },
        { status: 400 }
      )
    }

    // Find user by email (case-insensitive)
    const userRow = await db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email.trim().toLowerCase())
      .executeTakeFirst()

    // Also try with the email as-is (for usernames like "admin" without domain)
    const userRow2 = !userRow
      ? await db
          .selectFrom("users")
          .selectAll()
          .where("email", "=", email.trim())
          .executeTakeFirst()
      : null

    const foundUser = userRow || userRow2

    if (!foundUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Verify current password against bcrypt hash
    const passwordMatch = await bcrypt.compare(currentPassword, foundUser.password_hash)
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 401 }
      )
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update password in the database
    await db
      .updateTable("users")
      .set({ password_hash: newPasswordHash })
      .where("id", "=", foundUser.id)
      .execute()

    return NextResponse.json({ success: true, message: "Password updated successfully" })
  } catch (err) {
    console.error("Change password error:", err)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
