import {
    FileInput,
    Text,
    Space,
    AppShell,
    Center,
    rem,
    Container,
    Badge,
    Group,
    Accordion,
    Avatar,
    ScrollArea,
    Blockquote,
} from "@mantine/core";
import { useState, useEffect } from "react";
import "./app.css";

const AccordionLabel = ({ title, total }) => {
    return (
        <Group wrap="nowrap">
            <Avatar radius="lg" color="green" size="sm">
                {total}
            </Avatar>
            <div>
                <Text>{title}</Text>
            </div>
        </Group>
    );
};

const App = () => {
    const [file, setFile] = useState(null);
    const [clippings, setClippings] = useState([]);

    const handleClick = (e) => {
        e.target.classList.toggle("strike-through");
    };

    const getHighlights = (highlights) => {
        const items = [];

        for (let highlight of highlights) {
            if (highlight) {
                items.push(
                    <div
                        onClick={handleClick}
                        key={`${highlight.datetime.replace(/\s/g, "")}${highlight.location.replace(/\s/g, "")}`}
                    >
                        <Blockquote color="green" radius="lg" cite={highlight.datetime} mt="md">
                            {highlight.highlight}
                        </Blockquote>

                        <Text>{JSON.stringify(highlight.notes, null, 2)}</Text>
                        <Space h="md" />
                    </div>
                );
            }
        }

        return items;
    };

    const getTitles = () => {
        const items = [];

        for (let title of clippings) {
            if (title.title && title.highlights) {
                items.push(
                    <Accordion.Item key={title.title} value={title.title}>
                        <Accordion.Control>
                            <AccordionLabel title={title.title} total={title.highlights.length} />
                        </Accordion.Control>
                        <Accordion.Panel>
                            <ScrollArea h={400}>{getHighlights(title.highlights)}</ScrollArea>
                        </Accordion.Panel>
                    </Accordion.Item>
                );
            }
        }

        return items;
    };

    useEffect(() => {
        const reader = new FileReader();
        const newClippings = [];
        if (file && reader) {
            reader.readAsText(file);

            reader.onload = () => {
                const fileContents = reader.result;
                const lines = fileContents.split("\r\n");

                let i = 0;
                while (i < lines.length) {
                    const locationParts = lines[i + 1] ? lines[i + 1].split("|") : ["", ""];
                    const isHighlight = lines[i + 1] && lines[i + 1].includes("Highlight ") ? true : false;

                    if (lines[i + 3] && isHighlight) {
                        newClippings.push({
                            title: lines[i] ? lines[i].trim() : "",
                            location: locationParts[0].replace(/^[\s-]+|[\s-]+$/g, ""),
                            datetime: locationParts[locationParts.length - 1].replace(" Added on ", "").trim(),
                            highlight: isHighlight ? lines[i + 3].trim() : undefined,
                        });
                    }
                    i += 5;
                }

                const groupedClippings = Object.values(
                    newClippings.reduce((acc, item) => {
                        if (!acc[item.title]) {
                            acc[item.title] = { title: item.title, highlights: [] };
                        }
                        acc[item.title].highlights.push(item);
                        return acc;
                    }, {})
                );

                setClippings(groupedClippings);
            };
        }
    }, [file]);

    return (
        <AppShell padding="md" style={{ flex: 1 }}>
            <AppShell.Main pt={rem(25)}>
                <Center>
                    <Container size="md">
                        <Text size="xl" fw={700} variant="gradient" gradient={{ from: "green", to: "grape", deg: 145 }}>
                            Kindle Extractor
                        </Text>
                        <Text size="md" fw={300}>
                            Extract Notes from your kindle
                        </Text>
                        <Space h="lg" />
                        <FileInput
                            value={file}
                            onChange={setFile}
                            label="Upload 'My Clippings' File"
                            placeholder="My Clippings.txt"
                        />
                        <Space h="md" />
                        <Text size="xs">
                            Plug your kindle in via USB, unlock it if it has a pin. Open the removable drive that
                            appears. Navigate to documents, find the 'My Clippings.txt' file and upload it here
                        </Text>
                        <Space h="md" />
                        <Group justify="flex-end" gap="sm">
                            <Badge color="green">{clippings.length} titles</Badge>
                        </Group>
                        <Space h="md" />

                        <Accordion>{getTitles()}</Accordion>
                    </Container>
                </Center>
            </AppShell.Main>
        </AppShell>
    );
};

export default App;
