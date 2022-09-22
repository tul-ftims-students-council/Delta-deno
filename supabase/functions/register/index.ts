import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.19.1/mod.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const register = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  surname: z.string().min(3, "Surname must be at least 3 characters"),
  email: z.string().email("Email must be in right format"),
  phoneNumber: z
    .string()
    .regex(/^\d{9}$/, "Phone number must be 9 digit string"),
});

const { hostname, port, username, password } = Deno.env.toObject();
const client = new SmtpClient();
await client.connectTLS({
  hostname,
  port: Number(port),
  username,
  password,
});

serve(async (req) => {
  const reqBody = await req.json();
  console.log(reqBody);
  const parsed = register.safeParse(reqBody);
  if (parsed.success) {
    const data = {
      success: true,
    };

    await client.send({
      from: "delta@samorzad.p.lodz.pl",
      to: parsed.data.email,
      subject: "Thank you for signing up",
      content: "We sell the best roadrunner traps in the world!",
    });

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  return new Response(JSON.stringify({ success: false }), {
    headers: { "Content-Type": "application/json" },
    status: 400,
  });
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
