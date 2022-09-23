import { createClient, serve, SmtpClient, z } from "./deps.ts";

const register = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  surname: z.string().min(3, "Surname must be at least 3 characters"),
  email: z.string().email("Email must be in right format"),
  phoneNumber: z
    .string()
    .regex(/^\d{9}$/, "Phone number must be 9 digit string"),
});

type Register = z.infer<typeof register>;

const { hostname, port, username, password } = Deno.env.toObject();
const client = new SmtpClient();
try {
  await client.connectTLS({
    hostname,
    port: Number(port),
    username,
    password,
  });
} catch (e) {
  console.log(e);
}

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? ""
);

const successResponse = new Response(JSON.stringify({ success: true }), {
  status: 200,
  headers: {
    "content-type": "application/json",
  },
});

const errorResponse = (error: string) =>
  new Response(JSON.stringify({ success: false, error }), {
    headers: { "Content-Type": "application/json" },
    status: 400,
  });

serve(
  async (req) => {
    if (req.method !== "POST") return errorResponse("Method not allowed");

    const reqBody = await req.json();
    const parsed = register.safeParse(reqBody);

    if (!parsed.success) return errorResponse(parsed.error.message);

    const { error } = await supabaseClient
      .from<Register>("users")
      .insert(parsed.data);

    if (error) return errorResponse(error.message);

    try {
      await client.send({
        from: "delta@samorzad.p.lodz.pl",
        to: parsed.data.email,
        subject: "Thank you for signing up",
        content: "We sell the best roadrunner traps in the world!",
      });
    } catch (e) {
      console.log(e);
      return errorResponse("SMTP error");
    }

    return successResponse;
  },
  { port: 8080 }
);
