import { createSignal, For, Show, createResource } from "solid-js";
import { CredentialManager, XRPC } from "@atcute/client";
import { A, query, useParams } from "@solidjs/router";
import { didDocCache, resolveHandle, resolvePDS } from "../utils/api.js";
import { DidDoc } from "../utils/types.js";

const RepoView = () => {
  const params = useParams();
  const [didDoc, setDidDoc] = createSignal<DidDoc>();
  let rpc: XRPC;

  const describeRepo = query(
    (repo: string) =>
      rpc.get("com.atproto.repo.describeRepo", { params: { repo: repo } }),
    "describeRepo",
  );

  const fetchRepo = async () => {
    const did =
      params.repo.startsWith("did:") ?
        params.repo
      : await resolveHandle(params.repo);
    const pds = await resolvePDS(did);
    rpc = new XRPC({ handler: new CredentialManager({ service: pds }) });
    const res = await describeRepo(did);
    const didDocument = res.data.didDoc as DidDoc;
    setDidDoc(didDocument.id ? didDocument : didDocCache[did]);
    return res.data;
  };

  const [repo] = createResource(fetchRepo);

  return (
    <Show when={repo()}>
      <div class="flex w-[21rem] flex-col gap-2 break-words">
        <div class="flex flex-col border-b border-neutral-500 pb-2 font-mono">
          <p class="font-sans font-semibold text-stone-600 dark:text-stone-400">
            Collections
          </p>
          <For each={repo()?.collections}>
            {(collection) => (
              <A
                href={`${collection}`}
                class="text-lightblue-500 break-anywhere w-fit hover:underline"
              >
                {collection}
              </A>
            )}
          </For>
        </div>
        <Show when={didDoc()}>
          {(didDocument) => (
            <div class="flex flex-col gap-y-1">
              <div>
                <span class="font-semibold text-stone-600 dark:text-stone-400">
                  ID{" "}
                </span>
                <span>{didDocument().id}</span>
              </div>
              <div>
                <p class="font-semibold text-stone-600 dark:text-stone-400">
                  Identities
                </p>
                <ul class="ml-3">
                  <For each={didDocument().alsoKnownAs}>
                    {(alias) => <li>{alias}</li>}
                  </For>
                </ul>
              </div>
              <div>
                <p class="font-semibold text-stone-600 dark:text-stone-400">
                  Services
                </p>
                <ul class="ml-3">
                  <For each={didDocument().service}>
                    {(service) => (
                      <li class="flex flex-col">
                        <span>{service.id}</span>
                        <a
                          class="text-lightblue-500 w-fit hover:underline"
                          href={service.serviceEndpoint}
                          target="_blank"
                        >
                          {service.serviceEndpoint}
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
              <div>
                <p class="font-semibold text-stone-600 dark:text-stone-400">
                  Verification methods
                </p>
                <ul class="ml-3">
                  <For each={didDocument().verificationMethod}>
                    {(verif) => (
                      <li class="flex flex-col">
                        <span>#{verif.id.split("#")[1]}</span>
                        <span>{verif.publicKeyMultibase}</span>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
              <a
                class="text-lightblue-500 flex w-fit items-center hover:underline"
                href={
                  repo()?.did.startsWith("did:plc") ?
                    `https://plc.directory/${repo()?.did}`
                  : `https://${repo()?.did.split("did:web:")[1]}/.well-known/did.json`
                }
                target="_blank"
              >
                DID document{" "}
                <div class="i-tabler-external-link ml-0.5 text-xs" />
              </a>
              <Show when={repo()?.did.startsWith("did:plc")}>
                <a
                  class="text-lightblue-500 flex w-fit items-center hover:underline"
                  href={`https://boat.kelinci.net/plc-oplogs?q=${repo()?.did}`}
                  target="_blank"
                >
                  PLC operation logs{" "}
                  <div class="i-tabler-external-link ml-0.5 text-xs" />
                </a>
              </Show>
            </div>
          )}
        </Show>
      </div>
    </Show>
  );
};

export { RepoView };
