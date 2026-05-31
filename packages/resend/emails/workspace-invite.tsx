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
  baseUrl: string;
  invitedByName: string;
  workspaceName: string;
  inviteUrl: string;
}

export default function WorkspaceInviteEmail(props: WorkspaceInviteEmailProps) {
  const {
    invitedByName = "A teammate",
    workspaceName = "a Caley workspace",
    inviteUrl = "https://www.caley.io",
  } = props;

  return (
    <Html>
      <Head />
      <Preview>
        {invitedByName} invited you to {workspaceName}
      </Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Section>
              <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
                Join {workspaceName} on Caley.io
              </Heading>
              <Text style={paragraph}>
                {invitedByName} invited you to collaborate in {workspaceName}.
              </Text>
              <Section className="mb-[32px] mt-[32px] text-center">
                <Button
                  className="rounded bg-[#000000] px-5 py-3 text-center text-[14px] text-white no-underline"
                  href={inviteUrl}
                >
                  Accept invitation
                </Button>
              </Section>
              <Text style={paragraph}>
                If the button does not work, copy and paste this link into your
                browser: {inviteUrl}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
};
