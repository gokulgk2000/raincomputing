import React, {
  useEffect,
  useState,
  Suspense,
  lazy,
  useCallback,
  useRef,
} from "react"
import { MetaTags } from "react-meta-tags"
import {
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Input,
  Label,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
  Form,
  FormGroup,
  InputGroup,
  UncontrolledDropdown,
  Modal,
  ModalHeader,
} from "reactstrap"
import PerfectScrollbar from "react-perfect-scrollbar"
import "react-perfect-scrollbar/dist/css/styles.css"
import toastr from "toastr"
import "toastr/build/toastr.min.css"
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import profile from "assets/images/avatar-defult.jpg"
import UserDropdown from "rainComputing/components/chat/UserDropdown"
import classNames from "classnames"
import ChatboxSettingDropdown from "rainComputing/components/chat/ChatboxSettingDropdown"
import { useUser } from "rainComputing/contextProviders/UserProvider"
import TextareaAutosize from "react-textarea-autosize"
import {
  createOnevsOneChat,
  getAllUsers,
  getCasesByUserId,
  getCounts,
  getGroupsByUserIdandCaseId,
  getMessagesByUserIdandGroupId,
  getOnevsOneChat,
  getMessageById,
  updateCase,
  deleteLastMsg,
  sentEmail,
} from "rainComputing/helpers/backend_helper"
import { postReplies } from "rainComputing/helpers/backend_helper"
import { Link } from "react-router-dom"
import { isEmpty, map, now } from "lodash"
import DynamicModel from "rainComputing/components/modals/DynamicModal"
import { useToggle } from "rainComputing/helpers/hooks/useToggle"
import DynamicSuspense from "rainComputing/components/loader/DynamicSuspense"
import { initialNewCaseValues } from "rainComputing/helpers/initialFormValues"
import CaseGrid from "rainComputing/components/chat/CaseGrid"
import useAccordian from "rainComputing/helpers/hooks/useAccordian"
import SubgroupBar from "rainComputing/components/chat/SubgroupBar"
import { useChat } from "rainComputing/contextProviders/ChatProvider"
import moment from "moment"
import axios from "axios"
import { SERVER_URL } from "rainComputing/helpers/configuration"
import AttachmentViewer from "rainComputing/components/chat/AttachmentViewer"
import NoChat from "rainComputing/components/chat/NoChat"
import DeleteModal from "rainComputing/components/modals/DeleteModal"
import { useNotifications } from "rainComputing/contextProviders/NotificationsProvider"
import { useQuery } from "rainComputing/helpers/hooks/useQuery"
import ChatLoader from "rainComputing/components/chat/ChatLoader"
import EditCase from "rainComputing/components/chat/EditCase"
import { Mention, MentionsInput } from "react-mentions"
import { useDropzone } from "react-dropzone"
import ForwardMsg from "rainComputing/components/chat/ForwardMsg"

const CreateCase = lazy(() =>
  import("rainComputing/components/chat/CreateCase")
)
const SubGroups = lazy(() => import("rainComputing/components/chat/SubGroups"))

//Chat left sidebar nav items
const sidebarNavItems = ["Chat", "Case", "Contact"]

const initialPageCount = {
  chats: 3,
  cases: 3,
  users: 3,
}

const ChatRc = () => {
  let query = useQuery()
  const { currentUser } = useUser()
  const {
    toggleOpen: newCaseModelOpen,
    setToggleOpen: setNewCaseModelOpen,
    toggleIt: toggleNewCaseModelOpen,
  } = useToggle(false)
  const {
    toggleOpen: subGroupModelOpen,
    setToggleOpen: setSubGroupModelOpen,
    toggleIt: togglesubGroupModelOpen,
  } = useToggle(false)
  const {
    toggleOpen: chatSettingOpen,
    setToggleOpen: setChatSettingOpen,
    toggleIt: toggleChatSettingOpen,
  } = useToggle(false)
  const {
    toggleOpen: forwardModalOpen,
    setToggleOpen: setForwardModalOpen,
    toggleIt: toggleForwardModal,
  } = useToggle(false)

  const {
    chats,
    setChats,
    currentRoom: currentChat,
    setCurrentRoom: setCurrentChat,
    getRoomsonEveryMessage,
    handleSendingMessage,
    messages,
    setMessages,
    messageStack,
  } = useChat()
  const { notifications, setNotifications } = useNotifications()
  const [forwardMessages, setForwardMessages] = useState([])
  const { activeAccordian, handleSettingActiveAccordion } = useAccordian(-1)
  const {
    toggleOpen: caseDeleteModalOpen,
    setToggleOpen: setCaseDeleteModalOpen,
    toggleIt: toggleCaseDeleteModal,
  } = useToggle(false)
  const {
    toggleOpen: MsgDeleteModalOpen,
    setToggleOpen: setMsgDeleteModalOpen,
    toggleIt: toggleMsgDeleteModal,
  } = useToggle(false)
  const {
    toggleOpen: caseEditModalOpen,
    setToggleOpen: setCaseEditModalOpen,
    toggleIt: toggleCaseEditModal,
  } = useToggle(false)
  const [isChatScroll, setIsChatScroll] = useState(false)
  const [messageBox, setMessageBox] = useState(null)
  const [pageLoader, setPageLoader] = useState(false)
  const [chatLoader, setChatLoader] = useState(true)
  const [activeTab, setactiveTab] = useState("1")
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [newCase, setNewCase] = useState(initialNewCaseValues)
  const [allCases, setAllCases] = useState([])
  const [caseLoading, setCaseLoading] = useState(false)
  const [currentCase, setCurrentCase] = useState(null)
  const [allgroups, setAllgroups] = useState([])
  const [receivers, setReceivers] = useState([])
  const [curMessage, setcurMessage] = useState("")
  const [isAttachment, setIsAttachment] = useState(false)
  const [allFiles, setAllFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [totalPages, setTotalPages] = useState(initialPageCount)
  const [contactPage, setContactPage] = useState(1)
  const [casePage, setCasePage] = useState(1)
  const [search_Menu, setsearch_Menu] = useState(false)
  const [searchMessageText, setSearchMessagesText] = useState("")
  const [searchedMessages, setSearchedMessages] = useState([])
  const [mentionsArray, setMentionsArray] = useState([])
  const [replyMessage, setReplyMessage] = useState("")
  const [curReplyMessageId, setCurReplyMessageId] = useState(null)
  const [createReplyMsgModal, setCreateReplyMsgModal] = useState(false)
  const [isDeleteMsg, setIsDeleteMsg] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [email, setEmail] = useState("")

  //Toaster settings
  toastr.options = {
    progressBar: true,
    closeButton: true,
  }

  //Handle Body Scrolling
  isChatScroll ? disableBodyScroll(document) : enableBodyScroll(document)

  //Scroll to messages bottom on load & message arrives
  useEffect(() => {
    if (!isEmpty(messages)) scrollToBottom()
  }, [messages])

  //Toggle Active tab in chat-left-side
  const toggleTab = tab => {
    if (activeTab !== tab) {
      setactiveTab(tab)
    }
  }

  //Toggle Chat Box Menus
  const toggleSearch = () => {
    setsearch_Menu(!search_Menu)
  }

  //Getting Notofication Count
  const getNotificationCount = id => {
    const notiCount = notifications.filter(c => c.groupId === id)
    return notiCount ? notiCount.length : 0
  }

  //Getting Notofication for Case
  const notifyCountforCase = id => {
    const notiCount = notifications.find(c => c.caseId === id)
    return notiCount ? true : false
  }
  const handleForwardMessage = async msgId => {
    setChatLoader(true)
    const payload = {
      msgId: msgId,
    }
    const res = await getMessageById(payload)
    if (res.success) {
      setForwardMessages(res.Msg)
      //setcurMessage(res.messageData)
      console.log("fmsg", res)
    } else {
      console.log("Failed to fetch message", res)
    }
    //setcurMessage(res.messageData)
    setChatLoader(false)
  }
  //Getting all 1vs1 chats
  const ongetAllChatRooms = async () => {
    const chatRoomsRes = await getOnevsOneChat({ userId: currentUser.userID })
    if (chatRoomsRes.success) {
      setChats(chatRoomsRes.groups)
      setCurrentChat(chatRoomsRes.groups[0])
      if (chatRoomsRes.groups.length < 1) {
        setactiveTab("3")
      }
    } else {
      setChats([])
    }
    setChatLoader(false)
  }

  //Creating New ChatRoom
  const handleCreateChatRoom = async id => {
    setPageLoader(true)
    const payload = {
      members: [currentUser?.userID, id],
    }
    const createdChatRes = await createOnevsOneChat(payload)
    if (createdChatRes.success) {
      // toastr.success(`Chat has been created successfully`, "Success")
      await ongetAllChatRooms()
      setCurrentChat(createdChatRes.group)
      setactiveTab("1")
    } else {
      // toastr.error(`Failed to create chat`, "Failed!!!")
      console.log("Failed to create 1vs1 chat ", createdChatRes)
    }
    setPageLoader(false)
  }

  //Getting 1vs1 chat name
  const getChatName = members => {
    const chatMember = members.filter(
      member => member.id?._id !== currentUser.userID
    )
    if (chatMember.length > 0)
      return chatMember[0].id?.firstname + " " + chatMember[0].id?.lastname
    return "Guest Chat"
  }

  //Getting 1vs1 chat name
  const getChatEmail = members => {
    const chatMember = members.find(
      member => member.id?._id !== currentUser.userID
    )
    if (chatMember) return chatMember.id?.email
    return "Guest Chat"
  }

  //getting 1vs1 chat profilePic
  const getChatProfilePic = members => {
    const chatMember = members.filter(
      member => member.id?._id !== currentUser.userID
    )
    if (chatMember.length > 0)
      return chatMember[0].id?.profilePic
        ? chatMember[0].id?.profilePic
        : profile

    return profile
  }

  //getting 1vs1 chat sender name
  const getSenderOneChat = senderId => {
    const chatMember = currentChat?.groupMembers.find(
      member => member.id?._id === senderId
    )
    if (chatMember)
      return chatMember.id?.firstname + " " + chatMember.id?.lastname
    return senderId
  }

  //Getting all the cases
  const ongetAllCases = async ({ isSet = false, isSearch = false }) => {
    setCaseLoading(true)
    const allCasesRes = await getCasesByUserId({
      userId: currentUser.userID,
      page: isSearch ? 1 : casePage,
      searchText,
    })
    if (allCasesRes.success) {
      if (!isSearch) {
        setAllCases([...allCases, ...allCasesRes.cases])
      } else {
        setAllCases(allCasesRes.cases)
      }
      if (isSet) {
        setCurrentCase(allCasesRes?.cases[0])
      }
    } else {
      setAllCases([])
      setCurrentCase(null)
      setAllgroups(null)
      setCurrentChat(null)
      console.log("Rendering ongetAllCases error", allCasesRes)
    }
    setCaseLoading(false)
  }
  //Fetching user,case,group count
  const ongetCounts = async () => {
    const countRes = await getCounts({ userId: currentUser?.userID })
    if (countRes?.success) {
      const limit = 10
      const { userCount, chatCount, caseCount } = countRes
      setTotalPages({
        ...totalPages,
        chats: Math.ceil(chatCount / limit),
        users: Math.ceil(userCount / limit),
        cases: Math.ceil(caseCount / limit),
      })
    }
  }

  //Viewing Message
  const prettifyMsg = comment => {
    let regex = /@\[.+?\]\(.+?\)/gm
    let displayRegex = /@\[.+?\]/g
    let idRegex = /\(.+?\)/g
    let matches = comment.match(regex)
    let arr = []
    matches &&
      matches.forEach(m => {
        let id = m.match(idRegex)[0].replace("(", "").replace(")", "")
        let display = m.match(displayRegex)[0].replace("[", "").replace("]", "")

        arr.push({ id: id, display: display })
      })
    let newComment = comment.split(regex)
    let output = ""
    for (let i = 0; i < newComment.length; i++) {
      const c = newComment[i]
      if (i === newComment.length - 1) {
        output += c
      } else {
        output += c + `${arr[i].display}`
      }
    }
    return output
  }

  //Fetching Contacts
  const onGetContacts = async ({ isSearch = false }) => {
    if (searchText === "") {
      setContacts([])
    } else {
      setContactsLoading(true)
      const userRes = await getAllUsers({
        userID: currentUser.userID,
        page: isSearch ? 1 : contactPage,
        searchText,
      })
      if (userRes.success) {
        if (!isSearch) {
          setContacts([...contacts, ...userRes.users])
        } else {
          setContacts(userRes?.users)
        }
      } else {
        setContacts([])
      }
      setContactsLoading(false)
    }
  }

  //Selecting current case
  const onSelectingCase = cas => {
    setCurrentCase(cas)
  }

  //Deleting Case
  const onDeletingCase = async () => {
    const payload = {
      id: currentCase?._id,
      deleteIt: true,
    }
    const res = await updateCase(payload)
    if (res.success) {
      toastr.success(
        `Case ${res?.caseId} has been Deleted successfully`,
        "Success"
      )
      setCurrentCase(null)
      await ongetAllChatRooms()
      await ongetAllCases({ isSet: false })
    } else {
      toastr.error("Failed to delete case", "Failed!!!")
    }
    setCaseDeleteModalOpen(false)
  }
  //Deleting Last Message
  const onDeletingMsg = async (msgid, createdAt) => {
    const payload = {
      id: msgid,
      deleteIt: true,
      createdAt: createdAt,
    }
    const res = await deleteLastMsg(payload)
    if (res.success) {
      setIsDeleteMsg(true)
      toastr.success(`Message  has been Deleted successfully`, "Success")
      setcurMessage("Message Deleted")
      //setDelMsg()
      await ongetAllChatRooms()
      await getMessagesByUserIdandGroupId()
    } else {
      toastr.error("Unable to delete Message after 1 min", "Failed!!!")
    }
    setMsgDeleteModalOpen(false)
  }
  //Textbox empty or spaces
  const isEmptyOrSpaces = () => {
    if (isAttachment) {
      return false
    }

    return curMessage === null || curMessage.match(/^ *$/) !== null
  }
  //reply Message

  const toggle_replyMsgModal = () => {
    setCreateReplyMsgModal(!createReplyMsgModal)
    document.body.classList.add("no_padding")
  }
  const toggle_emailModal = () => {
    setEmailModal(!emailModal)
    document.body.classList.add("no_padding")
  }

  const handlereplyMsgCancel = () => {
    setCreateReplyMsgModal(false)
  }

  const handleReplyMessage = async id => {
    const payload = {
      id,
      sender: currentUser?.userID,
      msg: replyMessage,
    }

    const res = await postReplies(payload)
    const payloadMsg = {
      groupId: currentChat?._id,
      userId: currentUser?.userID,
    }
    await getMessagesByUserIdandGroupId(payloadMsg)
    console.log("replies : ", res)
    setReplyMessage("")
    setCreateReplyMsgModal(false)
  }
  useEffect(() => {
    getMessagesByUserIdandGroupId
  
  }, [])
  

  //Sending Message
  const handleSendMessage = async () => {
    setLoading(true)
    if (isEmptyOrSpaces()) {
      console.log("You can't send empty message")
    } else {
      let attachmentsId = []
      let payLoad = {
        caseId: currentCase?._id,
        groupId: currentChat?._id,
        sender: currentUser?.userID,
        receivers,
        messageData: curMessage,
        isAttachment,
        isForward: false,
      }
      if (isAttachment) {
        const formData = new FormData()
        for (var i = 0; i < allFiles.length; i++) {
          formData.append("file", allFiles[i])
        }
        // formData.append("file", allFiles)
        const fileUploadRes = await axios.post(
          `${SERVER_URL}/upload`,
          formData,
          {
            headers: {
              "Content-Type": `multipart/form-data`,
            },
          }
        )
        const { data } = fileUploadRes
        if (data.success) {
          await data.files?.map(file =>
            attachmentsId.push({
              type: file.contentType,
              size: file.size,
              id: file.id,
              name: file.originalname,
              dbName: file.filename,
              aflag: true,
            })
          )
        } else {
          setLoading(false)
        }
      }
      payLoad.attachments = attachmentsId
      handleSendingMessage(payLoad)
      console.log("att", allFiles)
      setAllFiles([])
      setcurMessage("")
      setIsAttachment(false)
    }
    setLoading(false)
  }

  const { getRootProps, getInputProps } = useDropzone({
    accept: ".png, .jpg, .jpeg,.pdf,.doc,.xls,.docx,.xlsx,.zip",
    onDrop: acceptedFiles => {
      setAllFiles(
        acceptedFiles.map(allFiles =>
          Object.assign(allFiles, {
            preview: URL.createObjectURL(allFiles),
          })
        )
      )
      console.log("Result", getInputProps)
    },
  })

  //Detecting Enter key Press in textbox
  const onKeyPress = e => {
    const { key } = e
    if (key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  //Getting sender name
  const getMemberName = id => {
    const memberName = allCases
      .find(cas => cas._id === currentCase?._id)
      ?.caseMembers?.find(member => member?.id?._id === id)
    if (memberName)
      return memberName?.id?.firstname + " " + memberName?.id?.lastname
    return id
  }

  //Scrolling to bottom of message
  const scrollToBottom = () => {
    if (messageBox) {
      messageBox.scrollTop = messageBox.scrollHeight + 1000
    }
  }

  //Handling File change
  const handleFileChange = e => {
    setAllFiles(e.target.files)
  }

  //Fetching SubGroups
  const onGettingSubgroups = async () => {
    setChatLoader(true)
    const payLoad = {
      caseId: currentCase._id,
      userId: currentUser.userID,
    }
    const subGroupsRes = await getGroupsByUserIdandCaseId(payLoad)
    if (subGroupsRes.success) {
      setAllgroups(subGroupsRes.groups)
      setCurrentChat(subGroupsRes.groups[0])
    }
    setChatLoader(false)
  }

  //Archieve Chat
  const onArchievingChat = () => {
    setChatLoader(true)
    const doc = new jsPDF()
    const header = [
      ["Sender", "message", "Time", "Group name", "Case name", "Attachments"],
    ]
    let rows = []
    const caseName = currentCase?.caseName ? currentCase?.caseName : "-"
    const groupName = currentChat?.isGroup
      ? currentChat?.groupName
      : getChatName(currentChat?.groupMembers)
    messages.map(m => {
      const sender = m?.caseId
        ? getMemberName(m?.sender)
        : getSenderOneChat(m?.sender)
      const message = m?.messageData
      const time = moment(m?.createdAt).format("DD-MM-YY HH:mm")
      const attachments = m.isAttachment ? m.attachments?.length : "-"
      const tempRow = [sender, message, time, groupName, caseName, attachments]

      rows.push(tempRow)
    })
    // doc.autoTable(col, rows, { startY: 10 })
    autoTable(doc, {
      bodyStyles: { valign: "top" },
      margin: {
        top: 30,
      },
      head: header,
      body: rows,
      theme: "grid",
      columnStyles: { 5: { halign: "center" } },
      headStyles: {
        fillColor: [0, 0, 230],
        fontSize: 12,
        fontStyle: "bold",
        font: "courier",
        halign: "center",
      },
      willDrawCell: data => {
        if (
          data.section === "body" &&
          data.column.index === 5 &&
          data.cell.raw !== "-"
        ) {
          data.doc.setFillColor("green")
          data.doc.setTextColor("black")
        }
      },
      didDrawPage: data => {
        doc.setFontSize(20)
        doc.setTextColor(40)
        doc.text(
          `${
            currentCase?.caseName ? currentCase?.caseName : "Private Chat"
          }-${groupName}`,
          data.settings.margin.left,
          20
        )
      },
    })
    const docName = `${
      currentCase?.caseName ? currentCase?.caseName : "Private Chat"
    }-${groupName}-${moment(Date.now()).format("DD-MM-YY HH:mm")}`
    doc.save(docName)
    setChatLoader(false)
  }

  //Handle sending email
  const onSendEmail = async () => {
    const payLoad = {
      mail: email,
      chatRoomId: currentChat?._id,
      caseName: currentCase?.caseName ? currentCase?.caseName : "PrivateChat",
      groupName:  currentChat?.isGroup
      ? currentChat?.groupName
      : getChatName(currentChat?.groupMembers)
    }
    const mailRes = await sentEmail (payLoad)
    console.log ("mailRes :",mailRes);
    setEmail(mailRes.true)
    setEmailModal(false)
  }
 

  //Contacts infiniteScroll
  const handleContactScroll = t => {
    if (
      t.clientHeight + t.scrollTop + 1 >= t.scrollHeight &&
      contactPage <= totalPages?.users
    ) {
      setContactPage(contactPage + 1)
    }
  }

  //Cases infiniteScroll
  const handleCaseScroll = t => {
    if (
      t.clientHeight + t.scrollTop + 1 >= t.scrollHeight &&
      casePage <= totalPages?.cases
    ) {
      setCasePage(casePage + 1)
    }
  }

  //Message search
  useEffect(() => {
    if (searchMessageText) {
      setSearchedMessages(
        messages?.filter(m =>
          m?.messageData.toLowerCase().includes(searchMessageText.toLowerCase())
        )
      )
    } else {
      setSearchedMessages([])
    }
    return () => {
      setSearchedMessages([])
    }
  }, [searchMessageText])

  //Text Convert into Link URL
  const stringFormatter = txt => {
    if (txt.includes("http" || "www")) {
      const firstIndex = txt.indexOf("http")
      const linkEnd = txt.indexOf(" ", firstIndex) //find the end of link
      const firstTextSection = txt.slice(0, firstIndex)
      const linkSection = txt.slice(
        firstIndex,
        linkEnd !== -1 ? linkEnd : txt.length
      )
      const secondSection = txt.slice(linkEnd !== -1 ? linkEnd : txt.length)
      return (
        <p>
          {firstTextSection}{" "}
          <a href={linkSection} target="_blank" rel="noreferrer">
            {linkSection}
          </a>
          {secondSection}
        </p>
      )
    } else {
      return <p>{txt}</p>
    }
  }

  //Resetting page whiule changing Tab
  useEffect(() => {
    setContactPage(1)
    setCasePage(1)
    // if (activeTab === "3") onGetContacts({ isSearch: true })
    // if (activeTab === "2") ongetAllCases({ isSearch: true })
  }, [activeTab])

  //SideEffect for setting isAttachment
  useEffect(() => {
    if (Array.from(allFiles)?.length > 0) {
      setIsAttachment(true)
    } else {
      setIsAttachment(false)
    }
  }, [allFiles])

  //SideEffect for fetching Subgroups after case selected
  useEffect(() => {
    if (currentCase) {
      onGettingSubgroups()
    }
  }, [currentCase])

  //SideEffect of setting receivers after currentchat changes
  useEffect(() => {
    if (currentChat) {
      setcurMessage("")
      setMentionsArray(
        currentChat.groupMembers.map(m => ({
          id: m?.id?._id,
          display: m?.id?.firstname + " " + m?.id?.lastname,
        }))
      )
      setReceivers(
        currentChat.groupMembers
          .filter(m => m.id?._id !== currentUser.userID)
          .map(r => r.id?._id)
      )

      setNotifications(
        notifications.filter(n => n.groupId !== currentChat?._id)
      )
      const onGettingGroupMessages = async () => {
        setChatLoader(true)
        const payload = {
          groupId: currentChat?._id,
          userId: currentUser?.userID,
        }
        const res = await getMessagesByUserIdandGroupId(payload)
        if (res.success) {
          setMessages(res.groupMessages)
        } else {
          console.log("Failed to fetch Group message", res)
        }
        setChatLoader(false)
      }
      onGettingGroupMessages()
    }
  }, [currentChat])

  //SideEffect while contact page changes
  useEffect(() => {
    if (
      activeTab === "3" &&
      contactPage !== 1 &&
      contactPage <= totalPages?.users
    ) {
      onGetContacts({ isSearch: false })
    }
    if (activeTab === "3" && contactPage === 1) {
      onGetContacts({ isSearch: true })
    }
  }, [contactPage])

  //SideEffect while case page changes
  useEffect(() => {
    if (activeTab === "2" && casePage !== 1 && casePage <= totalPages?.cases) {
      // onGetContacts({ isSearch: false })
      ongetAllCases({ isSearch: false })
    }
    if (activeTab === "3" && casePage === 1) {
      // onGetContacts({ isSearch: true })
      ongetAllCases({ isSearch: true })
    }
  }, [casePage])

  useEffect(() => {
    if (searchText === "") {
      if (activeTab === "3") setContactPage(1)
      if (activeTab === "2") setCasePage(1)
    }
    if (activeTab === "3") {
      onGetContacts({ isSearch: true })
    }
    if (activeTab === "2") {
      ongetAllCases({ isSet: true, isSearch: true })
    }
  }, [searchText])

  useEffect(() => {
    const userid = query.get("uid")
    if (userid && userid !== currentUser?.userID) {
      const onCreateOneonOneChat = async () => {
        await handleCreateChatRoom(userid)
      }
      onCreateOneonOneChat()
    }
    const handleAllAsyncReq = async () => {
      setPageLoader(true)
      await ongetCounts()
      await ongetAllChatRooms()
      setPageLoader(false)
      // await onGetContacts({ isSearch: false })
      await ongetAllCases({ isSet: false, isSearch: false })
    }
    handleAllAsyncReq()

    return () => {
      setChats([])
      setCurrentChat(null)
      setMessages([])
    }
  }, [])
  return (
    <div className="page-content">
      <>
        {pageLoader ? (
          <ChatLoader />
        ) : (
          <>
            {/*modal for Email*/}
            <Modal
              isOpen={emailModal}
              centered
              data-toggle="modal"
              toggle={() => {
                toggle_emailModal()
              }}
            >
              <div>
                <ModalHeader
                  className="border-bottom-0"
                  toggle={() => {
                    setEmailModal(!emailModal)
                  }}
                ></ModalHeader>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <div className="avatar-md mx-auto mb-4">
                    <div className="avatar-title bg-light  rounded-circle text-primary h1">
                      <i className="mdi mdi-email-open"></i>
                    </div>
                  </div>

                  <div className="row justify-content-center">
                    <div className="col-xl-10">
                      <h4 className="text-primary">Email !</h4>
                      <div className="input-group rounded bg-light">
                        <Input
                          type="email"
                          className="form-control bg-transparent border-0"
                          placeholder="Enter Email address"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          />
                        <Button
                          color="primary"
                          type="button"
                          id="button-addon2"
                          onClick={() => onSendEmail()}
                        >
                          <i className="bx bxs-paper-plane"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Modal>
            {/* Model for creating case*/}
            <Modal
              size="lg"
              isOpen={createReplyMsgModal && curReplyMessageId}
              toggle={() => {
                toggle_replyMsgModal()
              }}
              backdrop={"static"}
              id="staticBackdrop"
              centered
            >
              <div className="modal-header">
                <button
                  onClick={() => {
                    handlereplyMsgCancel()
                  }}
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <h5>Reply :</h5>
                <Row>
                  <Col>
                    <div className="position-relative">
                      <MentionsInput
                        type="text"
                        value={replyMessage}
                        onKeyPress={onKeyPress}
                        style={{
                          resize: "none",
                        }}
                        onChange={e => setReplyMessage(e.target.value)}
                        className="form-control chat-input"
                        placeholder="Enter Message..."
                      >
                        <Mention trigger="@" data={mentionsArray} />
                      </MentionsInput>
                    </div>
                  </Col>
                </Row>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    handlereplyMsgCancel()
                  }}
                  className="btn btn-secondary "
                  data-dismiss="modal"
                >
                  Close
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleReplyMessage(curReplyMessageId?._id)}
                >
                  Send
                </button>
              </div>
            </Modal>
            <DynamicModel
              open={newCaseModelOpen}
              toggle={toggleNewCaseModelOpen}
              size="lg"
              modalTitle="New Case"
              footer={false}
            >
              <DynamicSuspense>
                <CreateCase
                  formValues={newCase}
                  setFormValues={setNewCase}
                  contacts={contacts}
                  setModalOpen={setNewCaseModelOpen}
                  getAllCases={ongetAllCases}
                />
              </DynamicSuspense>
            </DynamicModel>

            {/* Model for creating subgroup */}
            {allgroups && (
              <DynamicModel
                open={subGroupModelOpen}
                toggle={togglesubGroupModelOpen}
                modalTitle="Subgroup Setting"
                modalSubtitle={`You have ${
                  allgroups.filter(a => !a.isParent)?.length || 0
                } subgroups`}
                footer={true}
                size="lg"
              >
                <DynamicSuspense>
                  <SubGroups
                    currentCaseId={currentCase?._id}
                    caseMembers={currentCase?.caseMembers}
                    groups={allgroups.filter(a => !a.isParent)}
                    getSubGroups={onGettingSubgroups}
                  />
                </DynamicSuspense>
              </DynamicModel>
            )}

            {/* Modal for Editing Case*/}
            {currentCase && (
              <EditCase
                open={caseEditModalOpen}
                setOpen={setCaseEditModalOpen}
                toggleOpen={toggleCaseEditModal}
                currentCase={currentCase}
                getAllCases={ongetAllCases}
                getSubGroups={onGettingSubgroups}
              />
            )}
            {contacts && (
              <ForwardMsg
                open={forwardModalOpen}
                setOpen={setForwardModalOpen}
                toggleOpen={toggleForwardModal}
                currentMsg={forwardMessages}
                
              />
            )}

            {/* Modal for deleting Case*/}
            <DeleteModal
              show={caseDeleteModalOpen}
              onDeleteClick={() => onDeletingCase()}
              confirmText="Yes,Remove"
              cancelText="Cancel"
              onCloseClick={toggleCaseDeleteModal}
            />
            {messages &&
              messages.map((msg,m) => (
                <DeleteModal
                  key={ m }
                  show={MsgDeleteModalOpen}
                  onDeleteClick={() =>
                    onDeletingMsg(msg._id, msg.createdAt, msg.messageData)
                  }
                  confirmText="Yes,Remove"
                  cancelText="Cancel"
                  onCloseClick={toggleMsgDeleteModal}
                />
              ))}
            <MetaTags>
              <title>Chat RC</title>
            </MetaTags>
            <Container fluid>
              <Row>
                <Col xs="12" lg="5">
                  <div className="pb-2 border-bottom">
                    <Link className="d-flex" to="/profile">
                      <div className="align-self-center me-3">
                        <img
                          src={
                            currentUser?.profilePic
                              ? currentUser?.profilePic
                              : profile
                          }
                          className="avatar-sm rounded-circle"
                          alt=""
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                      <div className="flex-grow-1">
                        <h5 className="font-size-14 mt-0 mb-1">
                          {currentUser?.firstname + " " + currentUser?.lastname}
                        </h5>
                        <p className="text-muted mb-0">
                          <i className="mdi mdi-circle text-success align-middle me-1" />
                          Active
                        </p>
                      </div>
                      {/* <UserDropdown /> */}
                    </Link>
                  </div>
                  {activeTab !== "1" && (
                    <div className="mx-2 mt-2  border-bottom">
                      <input
                        className="form-control"
                        type="text"
                        id="user-search-text"
                        placeholder="Search here"
                        value={searchText}
                        name="searchText"
                        onChange={e => setSearchText(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="my-1">
                    <Nav pills justified>
                      {sidebarNavItems.map((navItem, n) => (
                        <NavItem key={n}>
                          <NavLink
                            className={classNames({
                              active: activeTab === JSON.stringify(n + 1),
                            })}
                            onClick={() => {
                              toggleTab(JSON.stringify(n + 1))
                            }}
                          >
                            {navItem}
                          </NavLink>
                        </NavItem>
                      ))}
                    </Nav>
                    <TabContent activeTab={activeTab} className="py-1">
                      <TabPane tabId="1">
                        <ul
                          className="list-unstyled chat-list"
                          id="recent-list"
                        >
                          <PerfectScrollbar style={{ height: "300px" }}>
                            {map(chats, chat => (
                              <li
                                key={chat._id}
                                className={
                                  currentChat && currentChat._id === chat._id
                                    ? "active"
                                    : ""
                                }
                              >
                                <Link
                                  to="#"
                                  onClick={() => {
                                    setCurrentCase(null)
                                    setCurrentChat(chat)
                                  }}
                                >
                                  <div className="d-flex">
                                    <div className="align-self-center me-3">
                                      <img
                                        src={
                                          chat.isGroup
                                            ? profile
                                            : getChatProfilePic(
                                                chat.groupMembers
                                              )
                                        }
                                        className="rounded-circle  avatar-sm  "
                                        alt=""
                                        style={{ objectFit: "cover" }}
                                      />
                                    </div>

                                    <div className="flex-grow-1 overflow-hidden align-self-center ">
                                      <h5 className="text-truncate font-size-14 mb-1">
                                        {chat.isGroup
                                          ? chat.groupName
                                          : getChatName(chat.groupMembers)}
                                      </h5>
                                      <p className="text-truncate mb-0">
                                        {/* {chat.description} */}
                                      </p>
                                    </div>
                                    <div className="font-size-11">
                                      <div>
                                        {moment(chat.updatedAt).format(
                                          "DD-MM-YY HH:mm"
                                        )}
                                      </div>
                                      {getNotificationCount(chat._id) > 0 && (
                                        <div className="badge bg-danger  font-size-14 my-1">
                                          {getNotificationCount(chat._id)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              </li>
                            ))}
                          </PerfectScrollbar>
                        </ul>
                      </TabPane>
                      <TabPane tabId="2">
                        <div className="d-grid gap-2 my-2">
                          <button
                            type="button"
                            className="btn btn-info btn-rounded mb-2"
                            onClick={() => setNewCaseModelOpen(true)}
                          >
                            Create case
                            <i className="bx bx-pencil font-size-16 align-middle me-2 mx-2"></i>
                          </button>
                        </div>
                        {caseLoading ? (
                          <ChatLoader />
                        ) : (
                          <PerfectScrollbar
                            style={{ height: "300px" }}
                            onScroll={e => handleCaseScroll(e?.target)}
                          >
                            <ul className="list-unstyled chat-list ">
                              {allCases.length > 0 &&
                                allCases.map((ca, j) => (
                                  <CaseGrid
                                    caseData={ca}
                                    index={j}
                                    key={j}
                                    active={activeAccordian}
                                    onAccordionButtonClick={
                                      handleSettingActiveAccordion
                                    }
                                    handleSelectingCase={onSelectingCase}
                                    selected={currentCase?._id === ca?._id}
                                    notifyCountforCase={notifyCountforCase}
                                  />
                                ))}
                            </ul>
                          </PerfectScrollbar>
                        )}
                      </TabPane>
                      <TabPane tabId="3">
                        <div className="my-2">
                          {contactsLoading ? (
                            <ChatLoader />
                          ) : (
                            <PerfectScrollbar
                              style={{ height: "300px" }}
                              onScroll={e => handleContactScroll(e?.target)}
                            >
                              {contacts &&
                                contacts.map((contact, i) => (
                                  <ul
                                    key={i}
                                    className="list-unstyled chat-list"
                                  >
                                    <li>
                                      <Link
                                        to="#"
                                        onClick={() => {
                                          setCurrentCase(null)
                                          handleCreateChatRoom(contact._id)
                                        }}
                                      >
                                        <div className="d-flex justify-content-between">
                                          <div className="align-self-center d-flex align-items-center me-3">
                                            <img
                                              src={
                                                contact?.profilePic
                                                  ? contact?.profilePic
                                                  : profile
                                              }
                                              className="avatar-xs rounded-circle"
                                              alt=""
                                              style={{ objectFit: "cover" }}
                                            />
                                            <h5 className="font-size-14 mb-0 ms-2">
                                              {contact.firstname}{" "}
                                              {contact.lastname}
                                            </h5>
                                          </div>

                                          <i className="font-size-24 bx bxl-messenger me-2" />
                                        </div>
                                      </Link>
                                    </li>
                                  </ul>
                                ))}
                            </PerfectScrollbar>
                          )}
                        </div>
                      </TabPane>
                    </TabContent>
                  </div>
                </Col>
                <Col xs="12" lg="7" className="align-self-center">
                  <div className="w-100 ">
                    {currentChat ? (
                      chatLoader ? (
                        <ChatLoader />
                      ) : (
                        <Card className="chat-card">
                          <div className="py-2 px-3 border-bottom">
                            <Row>
                              <Col md="4" xs="9">
                                <h5 className="font-size-15 mb-1">
                                  {currentChat.isGroup
                                    ? currentCase?.caseName || "Case Chat"
                                    : getChatName(currentChat.groupMembers)}
                                </h5>
                                <h5 className="font-size-12 mb-1 text-primary">
                                  {!currentChat.isGroup &&
                                    getChatEmail(currentChat.groupMembers)}
                                </h5>
                                {currentChat?.isGroup && (
                                  <span
                                    style={{
                                      color: currentChat?.color
                                        ? currentChat?.color
                                        : "#0000FF",
                                    }}
                                  >
                                    {currentChat?.groupName}
                                  </span>
                                )}
                              </Col>
                              <Col md="8" xs="3">
                                <ul className="list-inline user-chat-nav text-end mb-0">
                                  <li className="list-inline-item d-none d-sm-inline-block">
                                    <Dropdown
                                      isOpen={search_Menu}
                                      toggle={toggleSearch}
                                    >
                                      <DropdownToggle
                                        className="btn nav-btn"
                                        tag="i"
                                      >
                                        <i className="bx bx-search-alt-2" />
                                      </DropdownToggle>
                                      <DropdownMenu className="dropdown-menu-md">
                                        {searchMessageText &&
                                        searchedMessages?.length > 1 ? (
                                          <span>
                                            {searchedMessages?.length} results
                                            found
                                          </span>
                                        ) : (
                                          ""
                                        )}
                                        <Form className="p-3">
                                          <FormGroup className="m-0">
                                            <InputGroup>
                                              <Input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search ..."
                                                aria-label="Recipient's username"
                                                value={searchMessageText}
                                                onChange={e =>
                                                  setSearchMessagesText(
                                                    e.target.value
                                                  )
                                                }
                                              />
                                              {/* <InputGroupAddon addonType="append"> */}
                                              <Button
                                                color="primary"
                                                type="submit"
                                              >
                                                <i className="mdi mdi-magnify" />
                                              </Button>
                                              {/* </InputGroupAddon> */}
                                            </InputGroup>
                                          </FormGroup>
                                        </Form>
                                      </DropdownMenu>
                                    </Dropdown>
                                  </li>
                                  <li className="list-inline-item align-middle">
                                    <Dropdown
                                      isOpen={chatSettingOpen}
                                      toggle={() =>
                                        toggleChatSettingOpen(!open)
                                      }
                                      className="float-end me-2"
                                    >
                                      <DropdownToggle
                                        className="btn nav-btn"
                                        tag="i"
                                      >
                                        <i className="bx bx-cog" />
                                      </DropdownToggle>

                                      {currentCase?.admins?.includes(
                                        currentUser?.userID
                                      ) ? (
                                        <DropdownMenu>
                                          <DropdownItem
                                            href="#"
                                            onClick={() => onArchievingChat()}
                                          >
                                            Archive Chat
                                          </DropdownItem>
                                          <DropdownItem
                                            href="#"
                                            onClick={() =>
                                              setCaseEditModalOpen(true)
                                            }
                                          >
                                            Manage Case
                                          </DropdownItem>
                                          <DropdownItem
                                            href="#"
                                            onClick={() =>
                                              toggle_emailModal(true)
                                            }
                                          >
                                            Email
                                          </DropdownItem>
                                          <DropdownItem
                                            href="#"
                                            onClick={() =>
                                              setCaseDeleteModalOpen(true)
                                            }
                                          >
                                            Delete case
                                          </DropdownItem>
                                        </DropdownMenu>
                                      ) : (
                                        currentChat &&
                                        currentChat?.admins?.includes(
                                          currentUser?.userID
                                        ) && (
                                          <DropdownMenu>
                                            <DropdownItem
                                              href="#"
                                              onClick={() => onArchievingChat()}
                                            >
                                              Archive Chat
                                            </DropdownItem>
                                            <DropdownItem href="#">
                                              Manage chat
                                            </DropdownItem>
                                            <DropdownItem
                                              href="#"
                                              onClick={() =>
                                                toggle_emailModal(true)
                                              }
                                            >
                                              Email
                                            </DropdownItem>
                                            <DropdownItem href="#">
                                              Delete chat
                                            </DropdownItem>
                                          </DropdownMenu>
                                        )
                                      )}
                                    </Dropdown>
                                  </li>
                                </ul>
                              </Col>
                            </Row>
                          </div>
                          <div>
                            <div className="chat-conversation p-3">
                              <ul className="list-unstyled">
                                <PerfectScrollbar
                                  style={{ height: "320px" }}
                                  containerRef={ref => setMessageBox(ref)}
                                  onMouseEnter={() => setIsChatScroll(true)}
                                  onMouseLeave={() => setIsChatScroll(false)}
                                >
                                  {messages &&
                                    messages.map((msg, m) => (
                                      <li
                                        key={"test_k" + m}
                                        className={
                                          msg.sender === currentUser.userID
                                            ? "right"
                                            : ""
                                        }
                                      >
                                        <div
                                          className="conversation-list"
                                          style={{
                                            maxWidth: "80%",
                                            backgroundColor:
                                              searchedMessages?.includes(msg) &&
                                              "black",
                                          }}
                                        >
                                          <UncontrolledDropdown>
                                            <DropdownToggle
                                              href="#"
                                              className="btn nav-btn  "
                                              tag="i"
                                            >
                                              <i className="bx bx-dots-vertical-rounded" />
                                            </DropdownToggle>
                                            <DropdownMenu>
                                              <DropdownItem
                                                href="#"
                                                onClick={() =>
                                                  handleForwardMessage(
                                                    msg._id
                                                  ) && setForwardModalOpen(true)
                                                }
                                              >
                                                Forward
                                              </DropdownItem>
                                              <DropdownItem
                                                href="#"
                                                onClick={() => {
                                                  setCurReplyMessageId(msg)
                                                  toggle_replyMsgModal()
                                                }}
                                              >
                                                Reply
                                              </DropdownItem>
                                              <DropdownItem
                                                href="#"
                                                onClick={() => {
                                                  msg.sender ===
                                                  currentUser.userID
                                                    ? setMsgDeleteModalOpen(
                                                        true
                                                      )
                                                    : toastr.info(
                                                        "Unable to  delete other's message"
                                                      )
                                                }}
                                              >
                                                Delete
                                              </DropdownItem>
                                            </DropdownMenu>
                                          </UncontrolledDropdown>
                                          <div
                                            className="ctext-wrap "
                                            style={{
                                              backgroundColor:
                                                msg.sender ==
                                                  currentUser.userID &&
                                                currentChat?.color
                                                  ? currentChat?.color + "33"
                                                  : "#00EE00" + "33",
                                            }}
                                          >
                                            {msg.isForward ? (
                                              <div className=" mdi mdi-forward">
                                                Forwarded:
                                              </div>
                                            ) : (
                                              <div className="conversation-name">
                                                {" "}
                                              </div>
                                            )}
                                            <div className="conversation-name">
                                              {currentChat.isGroup
                                                ? getMemberName(msg.sender)
                                                : getSenderOneChat(msg.sender)}
                                            </div>
                                            <div className="mb-1">
                                              {msg.isAttachment ? (
                                                <>
                                                  <AttachmentViewer
                                                    attachments={
                                                      msg.attachments
                                                    }
                                                    text={msg.messageData}
                                                  />
                                                  <div className="mt-3">
                                                    {" "}
                                                    {stringFormatter(
                                                      prettifyMsg(
                                                        msg.messageData
                                                      )
                                                    )}
                                                  </div>
                                                  <div
                                                    className="mt-1"
                                                    style={{
                                                      whiteSpace:
                                                        "break-spaces",
                                                    }}
                                                  >
                                                    {/* {stringFormatter(
                                                      msg.messageData
                                                    )} */}
                                                  </div>
                                                </>
                                              ) : (
                                                <div
                                                  style={{
                                                    whiteSpace: "break-spaces",
                                                  }}
                                                >
                                                  {stringFormatter(
                                                    prettifyMsg(msg.messageData)
                                                  )}
                                                </div>
                                                // <div
                                                //   style={{ whiteSpace: "pre" }}
                                                //   dangerouslySetInnerHTML={{
                                                //     __html: msg?.messageData,
                                                //   }}
                                                // />
                                              )}
                                            </div>

                                            <p className="chat-time mb-0">
                                              <i className="bx bx-comment-check align-middle me-1" />
                                              {/* <i className="bx bx-time-five align-middle me-1" /> */}
                                              {moment(msg.createdAt).format(
                                                "DD-MM-YY HH:mm"
                                              )}
                                              {msg?.replies?.map((r, i) => (
                                                <div
                                                  key={i}
                                                  className=" mdi mdi-reply m-2"
                                                >
                                                  Replies:
                                                  <div className="conversation-name">
                                                    {currentChat.isGroup
                                                      ? getMemberName(r?.sender)
                                                      : getSenderOneChat(
                                                          r?.sender
                                                        )}
                                                  </div>
                                                  <p>{r?.replyMsg}</p>
                                                </div>
                                              ))}
                                            </p>
                                            {/* <p className=" mt-2" > Reply :{msg?.replies?.replyMsg}</p> */}
                                          </div>
                                        </div>
                                      </li>
                                    ))}
                                  {messageStack?.length > 0 &&
                                    messageStack.map((msg, m) => (
                                      <li key={"test_k" + m} className="right">
                                        <div className="conversation-list">
                                          <div
                                            className="ctext-wrap "
                                            style={{
                                              backgroundColor:
                                                msg.sender ==
                                                  currentUser.userID &&
                                                currentChat?.color
                                                  ? currentChat?.color + "33"
                                                  : "#00EE00" + "33",
                                            }}
                                          >
                                            <div className="conversation-name">
                                              {currentUser?.firstname +
                                                currentUser?.lastname}
                                            </div>
                                            <div className="mb-1">
                                              {msg.messageData}
                                            </div>
                                            <p className="chat-time mb-0">
                                              <i className="bx bx-loader bx-spin  align-middle me-1" />
                                              {moment(msg.createdAt).format(
                                                "DD-MM-YY HH:mm"
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                      </li>
                                    ))}
                                </PerfectScrollbar>
                              </ul>
                            </div>
                            {currentChat?.isGroup && (
                              <SubgroupBar
                                groups={allgroups}
                                selectedGroup={currentChat}
                                setSelectedgroup={setCurrentChat}
                                openSubGroupmodel={setSubGroupModelOpen}
                                currentCase={currentCase}
                                notifyCount={getNotificationCount}
                              />
                            )}
                            <div className="p-2 chat-input-section">
                              <Row {...getRootProps()}>
                                <Col>
                                  <div className="position-relative">
                                    <MentionsInput
                                      type="text"
                                      value={curMessage}
                                      onKeyPress={onKeyPress}
                                      style={{
                                        resize: "none",
                                      }}
                                      onChange={e =>
                                        setcurMessage(e.target.value)
                                      }
                                      className="form-control chat-input"
                                      placeholder="Enter Message..."
                                    >
                                      <Mention
                                        trigger="@"
                                        data={mentionsArray}
                                      />
                                    </MentionsInput>

                                    <div className="chat-input-links">
                                      <ul className="list-inline mb-0">
                                        <li className="list-inline-item">
                                          <div>
                                            <div>
                                              <Input
                                                type="file"
                                                name="file"
                                                multiple={true}
                                                id="hidden-file"
                                                className="d-none"
                                                accept=".png, .jpg, .jpeg,.pdf,.doc,.xls,.docx,.xlsx,.zip"
                                                onChange={e => {
                                                  handleFileChange(e)
                                                }}
                                                {...getInputProps()}
                                              />

                                              <Label
                                                htmlFor="hidden-file"
                                                style={{ margin: 0 }}
                                              >
                                                <i
                                                  className="mdi mdi-attachment mdi-rotate-315"
                                                  style={{
                                                    color: "#556EE6",
                                                    fontSize: 16,
                                                  }}
                                                />
                                              </Label>
                                            </div>
                                          </div>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>

                                  {Array.from(allFiles)?.length > 0 && (
                                    <div className="d-flex gap-2 flex-wrap mt-2 ">
                                      {Array.from(allFiles)?.map((att, a) => (
                                        <span
                                          className="badge badge-soft-primary font-size-13"
                                          key={a}
                                        >
                                          {att.name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </Col>
                                <Col className="col-auto">
                                  {loading ? (
                                    <Button
                                      type="button"
                                      className="btn btn-primary btn-rounded chat-send w-md "
                                      color="primary"
                                      style={{ cursor: "not-allowed" }}
                                    >
                                      <i className="bx  bx-loader-alt bx-spin font-size-20 align-middle me-2"></i>
                                    </Button>
                                  ) : (
                                    <Button
                                      type="button"
                                      color="primary"
                                      onClick={() => handleSendMessage()}
                                      className="btn btn-primary btn-rounded chat-send w-md"
                                      disabled={isEmptyOrSpaces()}
                                    >
                                      <span className="d-none d-sm-inline-block me-2">
                                        Send
                                      </span>
                                      <i className="mdi mdi-send" />
                                    </Button>
                                  )}
                                </Col>
                              </Row>
                            </div>
                          </div>
                        </Card>
                      )
                    ) : (
                      <NoChat />
                    )}
                  </div>
                </Col>
              </Row>
            </Container>
          </>
        )}
      </>
    </div>
  )
}
export default ChatRc
