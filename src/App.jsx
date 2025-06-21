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
    Loader,
    ActionIcon,
    Flex,
    Code,
    Tooltip,
} from "@mantine/core";
import { useState, useEffect } from "react";
import md5 from "md5";
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Header,
    CommentRangeStart,
    CommentRangeEnd,
    CommentReference,
} from "docx";
import { saveAs } from "file-saver";
import classes from "./app.module.css";
import { IconDownload } from "@tabler/icons-react";
import formatDate from "./utils/formatDate";

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
    const [loading, setLoading] = useState(false);

    const [clippings, setClippings] = useState([]);

    const parseRange = (range) => {
        const [min, max] = range.split("-").map(Number);
        return { min, max, range };
    };

    const getNotes = (notes = []) => {
        const items = [];

        for (let note of notes) {
            items.push(
                <>
                    <Space h="sm" />
                    <Text>{JSON.stringify(note.note, null, 2)}</Text>
                </>
            );
        }

        return items;
    };

    const getHighlights = (highlights) => {
        const items = [];

        for (let highlight of highlights) {
            if (highlight && (highlight.location || highlight.page)) {
                items.push(
                    <div key={md5(highlight.datetime)}>
                        <Blockquote
                            color="green"
                            radius="lg"
                            cite={`${highlight.page ? `page ${highlight.page}, ` : ""} ${highlight.datetime}`}
                            mt="md"
                        >
                            {highlight.highlight}
                        </Blockquote>

                        {getNotes(highlight.notes)}

                        <Space h="md" />
                    </div>
                );
            }
        }

        return items;
    };

    const notesDownload = (index) => {
        const title = clippings[index];

        const comments = {
            children: [],
        };

        const addComments = (index, notes) => {
            for (let note of notes) {
                if (note.note) {
                    comments.children.push({
                        id: index,
                        author: "Kindle Extractor",
                        date: new Date(Date.parse(note.datetime)),
                        children: [
                            new Paragraph({
                                text: note.note,
                            }),
                        ],
                    });
                }
            }
        };

        const sections = [
            {
                properties: {},
                headers: {
                    default: new Header({
                        children: [new Paragraph(title.title)],
                    }),
                },
                children: title.highlights.map((item, index) => {
                    addComments(index, item.notes);
                    const paragraph = {
                        children: [
                            new CommentRangeStart(index),
                            new TextRun({
                                text: item.highlight,
                            }),
                            new CommentRangeEnd(index),
                        ],
                        spacing: { after: 500 },
                    };

                    if (item.notes.length > 0) {
                        paragraph.children.push(
                            new TextRun({
                                children: [new CommentReference(index)],
                                bold: true,
                            })
                        );
                    }
                    return new Paragraph(paragraph);
                }),
            },
        ];

        const doc = new Document({ comments, sections });

        Packer.toBlob(doc).then((blob) => {
            saveAs(blob, `${title.title}.docx`);
        });
    };

    const getTitles = () => {
        const items = [];

        for (let [index, title] of clippings.entries()) {
            if (title.title && title.highlights) {
                items.push(
                    <Accordion.Item key={title.title} value={title.title}>
                        <Accordion.Control>
                            <AccordionLabel
                                title={title.title}
                                total={title.highlights.length}
                                index={index}
                                notesDownload={notesDownload}
                            />
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Flex mih={50} gap="md" justify="flex-end" align="flex-start" direction="row" wrap="wrap">
                                <Tooltip label="Download Document">
                                    <ActionIcon
                                        onClick={() => {
                                            notesDownload(index);
                                        }}
                                        color="green"
                                        variant="subtle"
                                        aria-label="Download"
                                    >
                                        <IconDownload style={{ width: "70%", height: "70%" }} stroke={1.5} />
                                    </ActionIcon>
                                </Tooltip>
                            </Flex>
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
            setLoading(true);
            reader.readAsText(file);

            reader.onload = () => {
                const fileContents = reader.result;
                const entries = fileContents.split("==========")

                for(let entry of entries){
                    const lines = entry.split("\r\n");

                    const dashParts = lines[2] ? lines[2].split("|") : ["", ""];
                    const datetime = dashParts[dashParts.length - 1].replace(" Added on ", "").trim();
                    let page = undefined;
                    let location = undefined;
                    let locationPageString;

                    if (dashParts && dashParts.length > 2) {
                        locationPageString = dashParts[0] + dashParts[1];
                    } else {
                        locationPageString = dashParts[0];
                    }

                    const locationParts = locationPageString
                        .replace(/^[\s-]+|[\s-]+$/g, "")
                        .replace(/ +(?= )/g, "")
                        .split(" ");

                    let j = 0;
                    while (j < locationParts.length) {
                        if (locationParts[j] === "location" || locationParts[j] === "Location") {
                            location = locationParts[j + 1];
                        }
                        if (locationParts[j] === "page" || locationParts[j] === "Page") {
                            page = locationParts[j + 1];
                        }
                        j += 1;
                    }

                    if (!location) {
                        location = page;
                    }

                    const isHighlight = lines[2] && (lines[2].includes("Highlight ") || lines[2].includes("highlight "))? true : false;

                    //Create a new clipping
                    if (lines[4]) {
                        const clipping = {
                            title: lines[1] ? lines[1].trim() : "",
                            datetime,
                        };

                        if (location) {
                            if (isHighlight) {
                                clipping.location = parseRange(location);
                            } else {
                                clipping.location = parseInt(location);
                            }
                        }

                        if (page) {
                            clipping.page = page;
                        }

                        if (isHighlight) {
                            clipping.notes = [];
                            clipping.highlight = lines.slice(4).join(" ").trim();
                        } else {
                            clipping.note = lines.slice(4).join(" ").trim();
                        }

                        newClippings.push(clipping);
                        setLoading(false);
                    }
                }

                const groupedClippings = Object.values(
                    newClippings.reduce((acc, item) => {
                        if (!acc[item.title]) {
                            acc[item.title] = { title: item.title, highlights: [], notes: [] };
                        }

                        if (item.highlight) {
                            acc[item.title].highlights.push(item);
                        }

                        if (item.note) {
                            acc[item.title].notes.push(item);
                        }

                        return acc;
                    }, {})
                );

                for (let i in groupedClippings) {
                    for (let j in groupedClippings[i].highlights) {
                        let k = 0;
                        while (k < groupedClippings[i].notes.length) {
                            if (
                                groupedClippings[i].highlights[j].location.max >=
                                    groupedClippings[i].notes[k].location &&
                                groupedClippings[i].highlights[j].location.min <= groupedClippings[i].notes[k].location
                            ) {
                                const note = groupedClippings[i].notes.splice(k, 1);
                                groupedClippings[i].highlights[j].notes.push(note[0]);
                            } else {
                                k += 1;
                            }
                        }
                    }
                }

                setClippings(groupedClippings);
            };
        } else {
            setClippings([]);
        }
    }, [file]);

    return (
        <AppShell padding="md" style={{ flex: 1 }}>
            <AppShell.Main pt={rem(25)} className={classes.beforeFooter}>
                <Center>
                    <Container size="md">
                        <Text
                            ta="center"
                            size="xl"
                            fw={1000}
                            variant="gradient"
                            gradient={{ from: "green", to: "grape", deg: 120 }}
                        >
                            Kindle Extractor
                        </Text>

                        <Text ta="center" size="md" fw={300}>
                            Extract highlights and notes made on your kindle
                        </Text>
                        <Space h="lg" />

                        <Center>
                            <FileInput
                                clearable
                                value={file}
                                className={classes.fileInput}
                                onChange={setFile}
                                variant="filled"
                                accept="text/plain"
                                placeholder="Upload File"
                            />
                        </Center>

                        <Space h="md" />
                        <Text ta="center" size="xs">
                            Plug your kindle in via USB. If it's got a pin, unlock it. You should see that a new
                            removable drive has appeared on your device. Navigate to the <Code>Documents</Code> folder
                            and find the <Code>My Clippings.txt</Code> file. Upload this here
                        </Text>
                        <Space h="md" />
                        <Group justify="flex-end" gap="sm">
                            <Badge color="green">{clippings.length} titles</Badge>
                        </Group>
                        <Space h="md" />

                        {loading ? (
                            <Center>
                                <Loader color="green" size="xl" />
                            </Center>
                        ) : (
                            <Accordion>{getTitles()}</Accordion>
                        )}
                    </Container>
                </Center>
            </AppShell.Main>

            <AppShell.Footer>
                <Container className={classes.afterFooter}>
                    <Text c="dimmed" size="sm">
                        © 2025 Ryan McCartney. All rights reserved. Version: v{__VERSION__} Build Time:{" "}{formatDate(__BUILD_TIME__)} Hash:{" "}{__HASH__}
                    </Text>
                </Container>
            </AppShell.Footer>
        </AppShell>
    );
};

export default App;
