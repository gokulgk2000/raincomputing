import React, { useState } from "react"
import PropTypes from "prop-types"
import classNames from "classnames"
import { Col, Collapse, Row, Tooltip } from "reactstrap"
import "./style/case-grid.scss"
import Chevron from "assets/icon/chevron-down.svg"
import profile from "assets/images/avatar-defult.jpg"
import { useToggle } from "rainComputing/helpers/hooks/useToggle"
import OnOffSwitch from "../switch/OnOffSwitch"
import DynamicModel from "../modals/DynamicModal"
import CaseMembers from "./CaseMembers"
import CaseFilesGrid from "./CaseFilesGrid"

const CaseGrid = ({
  caseData,
  index,
  active,
  onAccordionButtonClick,
  handleSelectingCase,
  selected,
  notifyCountforCase,
}) => {
  const { toggleOpen: notifyOn, toggleIt: setNotifyOn } = useToggle(false)
  const {
    toggleOpen: membersModelOpen,
    setToggleOpen: setMembersModelOpen,
    toggleIt: toggleMembersModelOpen,
  } = useToggle(false)
  const {
    toggleOpen: filesModelOpen,
    setToggleOpen: setFilesModelOpen,
    toggleIt: toggleFilesModelOpen,
  } = useToggle(false)
  const AccordionContainer = ({ children, handleAccordionClick }) => (
    <Row
      className="align-items-baseline my-2 text-muted pointer"
      style={{ maxWidth: "100%" }}
      onClick={() => handleAccordionClick()}
    >
      <Col xs={11}>{children}</Col>
      <Col xs={1} style={{ padding: 0 }}>
        <img src={Chevron} className="accordion-icon-right" />
      </Col>
    </Row>
  )

  return (
    <>
      <>
        {/*Case files Model*/}
        <DynamicModel
          open={filesModelOpen}
          toggle={toggleFilesModelOpen}
          size="xl"
          modalTitle="Shared Files"
          isClose={true}
        >
          <CaseFilesGrid caseId={caseData?._id} />
        </DynamicModel>

        {/*Case members Model*/}
        <DynamicModel
          open={membersModelOpen}
          toggle={toggleMembersModelOpen}
          size="lg"
          modalTitle=" Case Members"
          modalSubtitle={`You have ${caseData?.caseMembers?.length} Members`}
        >
          <CaseMembers
            members={caseData?.caseMembers}
            admins={caseData?.admins}
            caseId={caseData?._id}
          />
        </DynamicModel>
      </>
      <li className={classNames("px-3 py-2", selected && "active-case-bg")}>
        <Row className="align-middle py-1" style={{ maxWidth: "100%" }}>
          <Col
            xs={10}
            className="pointer"
            onClick={() => handleSelectingCase(caseData)}
          >
            <span className="fw-medium">{caseData.caseId}</span>
            <span className="text-muted font-size-12 ms-2">
              {caseData.caseName}
            </span>
          </Col>
          <Col xs={1} style={{ padding: 2 }}>
            {notifyCountforCase(caseData?._id) && (
              <i className="bx bxs-bell bx-tada text-danger" />
            )}
          </Col>
          <Col xs={1} style={{ padding: 2 }}>
            <img
              src={Chevron}
              onClick={() => onAccordionButtonClick(index)}
              aria-expanded={index === active}
              className="accordion-icon"
            />
          </Col>
        </Row>

        <Collapse isOpen={index === active} className="accordion-collapse">
          <div className="mb-4 pointer">
            <span className="fw-medium font-size-11 ">Case Members</span>
            <AccordionContainer
              handleAccordionClick={() => setMembersModelOpen(true)}
            >
              <div className="members-container">
                {caseData?.caseMembers.map((member, m) => (
                  <div className="align-self-center me-1" key={m}>
                    <img
                      src={
                        member?.id?.profilePic
                          ? member?.id?.profilePic
                          : profile
                      }
                      className="avatar-xs rounded-circle "
                      alt=""
                      style={{ objectFit: "cover" }}
                    />
                    {/* <span className="d-flex fw-medium">
                      {members?.id?.firstname}{" "}
                    </span> */}
                  </div>
                ))}
              </div>
            </AccordionContainer>
          </div>
          <div className="mb-4 ">
            <span className="fw-medium font-size-11">
              Saved Messages & Files
            </span>
            {/* <AccordionContainer>
              <span>
                Bookmarks <span>({caseData?.bookmarks?.length})</span>
              </span>
            </AccordionContainer> */}
            {/* <AccordionContainer>
              <span>
                Pending Messages <span>(1)</span>
              </span>
            </AccordionContainer> */}
            <AccordionContainer
              handleAccordionClick={() => setFilesModelOpen(true)}
            >
              <span>Shared Files</span>
            </AccordionContainer>
          </div>
          {/* <div className="mb-2 pointer">
            <span className="fw-medium font-size-11">Case Notification</span>
            <div className="d-flex justify-content-between me-3">
              <span className="text-muted">Message Notification</span>
              <OnOffSwitch
                isNotificationOn={notifyOn}
                setNotify={setNotifyOn}
              />
            </div>
          </div> */}
        </Collapse>
      </li>
    </>
  )
}

CaseGrid.propTypes = {
  caseData: PropTypes.object,
  index: PropTypes.number,
  active: PropTypes.number,
  onAccordionButtonClick: PropTypes.func,
  handleSelectingCase: PropTypes.func,
  children: PropTypes.any,
  selected: PropTypes.bool,
  notifyCountforCase: PropTypes.func,
  handleAccordionClick: PropTypes.func,
}

export default CaseGrid
