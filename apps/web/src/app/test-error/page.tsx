// Test page to verify error handling in server components
// DELETE THIS FILE after testing

// Force dynamic rendering so error happens at runtime, not build time
export const dynamic = "force-dynamic";

export default async function TestErrorPage() {
  // Simulate an error in a server component
  throw new Error("Test error from server component");
}
