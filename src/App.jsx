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
} from "@mantine/core";
import { useState, useEffect } from "react";
import "./app.css";

const AccordionLabel = ({ title, total }) => {
    return (
        <Group wrap="nowrap">
            <Avatar radius="lg" color="blue" size="sm">
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
    const [notes, setNotes] = useState([]);

    const getUniqueTitles = (notes) => {
        return [...new Set(notes.map((item) => item.title))];
    };

    const handleClick = (e) => {
        e.target.classList.toggle("strike-through");
    };

    const getNotes = (groupedNotes) => {
        const items = [];

        for (let note of groupedNotes) {
            if (note) {
                items.push(
                    <div
                        onClick={handleClick}
                        key={`${note.datetime.replace(/\s/g, "")}${note.location.replace(/\s/g, "")}`}
                    >
                        <Group justify="space-between">
                            <Text size="sm" fw={700}>
                                {note.location}
                            </Text>
                            <Text size="sm" fs="italic">
                                {note.datetime}
                            </Text>
                        </Group>
                        <Space h="xs" />

                        <Text>{note.note}</Text>
                        <Space h="sm" />
                    </div>
                );
            }
        }

        return items;
    };

    const getTitles = () => {
        const items = [];

        const groupedNotes = Object.values(
            notes.reduce((acc, item) => {
                if (!acc[item.title]) {
                    acc[item.title] = { title: item.title, notes: [] };
                }
                acc[item.title].notes.push(item);
                return acc;
            }, {})
        );

        for (let group of groupedNotes) {
            if (group.title && group.notes) {
                items.push(
                    <Accordion.Item key={group.title} value={group.title}>
                        <Accordion.Control>
                            <AccordionLabel title={group.title} total={group.notes.length} />
                        </Accordion.Control>
                        <Accordion.Panel>
                            <ScrollArea h={400}>{getNotes(group.notes)}</ScrollArea>
                        </Accordion.Panel>
                    </Accordion.Item>
                );
            }
        }

        return items;
    };

    useEffect(() => {
        const reader = new FileReader();
        const newNotes = [];
        if (file && reader) {
            reader.readAsText(file);

            reader.onload = () => {
                const fileContents = reader.result;
                const lines = fileContents.split("\r\n");

                let i = 0;
                while (i < lines.length) {
                    const locationParts = lines[i + 1] ? lines[i + 1].split("|") : ["", ""];

                    newNotes.push({
                        title: lines[i] ? lines[i].trim() : "",
                        location: locationParts[0].replace(/^[\s-]+|[\s-]+$/g, ""),
                        datetime: locationParts[locationParts.length - 1].replace(" Added on ", "").trim(),
                        note: lines[i + 3] ? lines[i + 3].trim() : "",
                    });
                    i += 5;
                }
                setNotes(newNotes);
            };
        }
    }, [file]);

    return (
        <AppShell padding="md" style={{ flex: 1 }}>
            <AppShell.Main pt={rem(25)}>
                <Center>
                    <Container size="md">
                        <Text size="xl" fw={700} variant="gradient" gradient={{ from: "blue", to: "grape", deg: 145 }}>
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
                            <Badge>{notes.length} notes </Badge>
                            <Badge>{getUniqueTitles(notes).length} titles</Badge>
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
