import { useEffect, useState, useRef } from 'react'
import { Oval } from 'react-loader-spinner';

function Content() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectionBoundingBox, setSelectionBoundingBox] = useState<DOMRect>();
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [opinionData, setOpinionData] = useState<any>();

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'open') setIsOpen(true);
      if (message.type === 'opinion') setOpinionData(message.data);
    }
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [])

  useEffect(() => {
    const updateSelection = () => {
      if (isOpen) return;
      const selection = document.getSelection()
      if (selection?.rangeCount) {
        setSelectionBoundingBox(selection.getRangeAt(0).getBoundingClientRect())
        setScrollTop(window.scrollY)
      } else {
        setSelectionBoundingBox(undefined);
      }
    }
    document.addEventListener("selectionchange", updateSelection);
    return () => document.removeEventListener("selectionchange", updateSelection);
  }, [isOpen])

  useEffect(() => {
    if (!popupRef) return;
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current?.contains(e.target as Node) || e.target === popupRef.current) return;
      setIsOpen(false);
      setOpinionData(undefined);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [popupRef])

  const popupTop = selectionBoundingBox ? selectionBoundingBox.top + scrollTop : 0;
  const popupLeft = selectionBoundingBox ? Math.min(selectionBoundingBox.left + selectionBoundingBox.width + 10, window.innerWidth - 500) : 0;
  const isLoading = isOpen && opinionData === undefined;
  return (
    isOpen ? <div
      ref={popupRef}
      css={{
        position: 'absolute',
        top: popupTop,
        left: popupLeft,
        zIndex: Number.MAX_VALUE,
        backgroundColor: 'white',
        color: 'black',
        border: '1px solid grey',
        padding: '25px',
        margin: '20px',
        marginTop: '0',
        marginLeft: '0',
        paddingTop: '10px',
        borderRadius: '5px',
        fontSize: '14px',
        fontFamily: 'Sans-Serif',
        minWidth: '450px',
        maxWidth: '600px'
      }}
    >
      {
        isLoading
          ? <div css={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            marginTop: '12px'
          }}>
            <Oval
              height={64}
              width={64}
              color="#000000"
              wrapperStyle={{}}
              wrapperClass=""
              visible
              ariaLabel='oval-loading'
              secondaryColor="#000000"
              strokeWidth={2}
              strokeWidthSecondary={2}
            />
          </div>
          : (
            <>
              <h2>Conifer's Analysis</h2>
              <p>{opinionData.opinion.substring(14)}</p>
              {opinionData?.sources?.length > 0 && <h4 css={{ marginBottom: '0px' }}>Additional Reading:</h4>}
              <ul>
                {opinionData.sources.map((source: any) =>
                  <a css={{ color: 'black' }} href={source.web_url} target='_blank'>
                    <li key={source.uri}>
                      {source.headline ?? source.web_url.substring(8)}
                    </li>
                  </a>)
                }
              </ul>
              <footer><b>Disclaimer</b>: this opinion is AI generated and may not be accurate or biased.</footer>
            </>
          )
      }
    </div>
      : null
  )
}

export default Content
