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
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section>
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Join {workspaceName} on Caley.io
              </Heading>
              <Text style={paragraph}>
                {invitedByName} invited you to collaborate in {workspaceName}.
              </Text>
              <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                  className="bg-[#000000] rounded text-white text-[14px] no-underline text-center px-5 py-3"
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
