// @flow
import parseTitle from "shared/utils/parseTitle";
import DocumentsStore from "stores/DocumentsStore";
import Document from "models/Document";

type Options = {
  file: File,
  documents: DocumentsStore,
  collectionId: string,
  documentId?: string,
};

const importFile = async ({
  documents,
  file,
  documentId,
  collectionId,
}: Options): Promise<Document> => {
  // non plain text support
  if (documents.importFiletypesServer.includes(file.type)) {
    return await documents.import(
      file.name.replace(/\.[^/.]+$/, ""),
      documentId,
      collectionId,
      { publish: true, file }
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (ev) => {
      try {
        let text = ev.target.result;
        let title;

        // If the first line of the imported file looks like a markdown heading
        // then we can use this as the document title
        if (text.trim().startsWith("# ")) {
          const result = parseTitle(text);
          title = result.title;
          text = text.replace(`# ${title}\n`, "");

          // otherwise, just use the filename without the extension as our best guess
        } else {
          title = file.name.replace(/\.[^/.]+$/, "");
        }

        let document = new Document(
          {
            parentDocumentId: documentId,
            collectionId,
            text,
            title,
          },
          documents
        );

        document = await document.save({ publish: true });
        resolve(document);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
};

export default importFile;
