import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export interface WorkspaceInviteEmailProps {
  acceptUrl: string;
  invitedByName?: string | null;
  workspaceName: string;
}

export default function WorkspaceInviteEmail({
  acceptUrl = "https://www.getinboxzero.com/mail",
  invitedByName = "A teammate",
  workspaceName = "Caley workspace",
}: WorkspaceInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Join {workspaceName} on Caley.io</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Section>
              <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
                You have been invited to {workspaceName}
              </Heading>
              <Text style={paragraph}>
                {invitedByName || "A teammate"} invited you to collaborate in a
                Caley.io workspace.
              </Text>
              <Section className="my-[32px] text-center">
                <Button
                  href={acceptUrl}
                  className="rounded bg-black px-5 py-3 text-center text-[14px] font-semibold text-white no-underline"
                >
                  Accept invite
                </Button>
              </Section>
              <Text style={paragraph}>
                If you were not expecting this invitation, you can ignore this
                email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
};
