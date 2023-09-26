import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import {
  Button, Spacer, Checkbox, Tooltip, Divider, Tabs, Tab,
} from "@nextui-org/react";
import AceEditor from "react-ace";
import { toast } from "react-toastify";

import "ace-builds/src-min-noconflict/mode-json";
import "ace-builds/src-min-noconflict/theme-tomorrow";
import "ace-builds/src-min-noconflict/theme-one_dark";

import {
  runDataRequest as runDataRequestAction,
} from "../../../actions/dataRequest";
import { changeTutorial as changeTutorialAction } from "../../../actions/tutorial";
import CustomerQuery from "./CustomerQuery";
import CampaignsQuery from "./CampaignsQuery";
import Container from "../../../components/Container";
import Row from "../../../components/Row";
import Text from "../../../components/Text";
import useThemeDetector from "../../../modules/useThemeDetector";
import { IoChatboxEllipses, IoInformationCircleOutline, IoPeople, IoPlay, IoTrashBin } from "react-icons/io5";

/*
  The Customer.io data request builder
*/
function CustomerioBuilder(props) {
  const [cioRequest, setCioRequest] = useState({
    route: "",
  });
  const [result, setResult] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [invalidateCache, setInvalidateCache] = useState(false);
  const [limitValue, setLimitValue] = useState(0);
  const [entity, setEntity] = useState("");
  const [conditions, setConditions] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  const isDark = useThemeDetector();

  const {
    dataRequest, match, onChangeRequest, runDataRequest, project,
    connection, onSave, responses, changeTutorial, // eslint-disable-line
    onDelete,
  } = props;

  // on init effect
  useEffect(() => {
    if (dataRequest) {
      let newRequestData = dataRequest;

      if (dataRequest.configuration && dataRequest.configuration.cioFilters) {
        setConditions(dataRequest.configuration.cioFilters);
      }

      if (!dataRequest.configuration) {
        newRequestData = {
          ...newRequestData,
          configuration: {
            populateAttributes: true,
          },
        };
      }

      if (dataRequest.route) {
        if (dataRequest.route.indexOf("customers") > -1) {
          setEntity("customers");
        } else if (dataRequest.route.indexOf("campaigns/") > -1) {
          setEntity("campaigns");
        }
      }

      if (dataRequest.itemsLimit || dataRequest.itemsLimit === 0) {
        setLimitValue(dataRequest.itemsLimit);
      }

      setCioRequest(newRequestData);

      // setTimeout(() => {
      //   changeTutorial("Customerio");
      // }, 1000);
    }
  }, []);

  useEffect(() => {
    const newApiRequest = cioRequest;

    onChangeRequest(newApiRequest);
  }, [cioRequest, connection]);

  useEffect(() => {
    if (responses && responses.length > 0) {
      const selectedResponse = responses.find((o) => o.id === dataRequest.id);
      if (selectedResponse?.data) {
        setResult(JSON.stringify(selectedResponse.data, null, 2));
      }
    }
  }, [responses]);

  const _onSelectCustomers = () => {
    setEntity("customers");
    setCioRequest({ ...cioRequest, method: "POST", route: "customers" });
  };

  const _onSelectCampaigns = () => {
    setEntity("campaigns");
    setCioRequest({ ...cioRequest, method: "GET", route: "campaigns" });
  };

  const _onUpdateCustomerConditions = (conditions) => {
    setConditions(conditions);
    setCioRequest({
      ...cioRequest,
      configuration: {
        ...cioRequest.configuration,
        cioFilters: conditions
      },
    });
  };

  const _onTest = () => {
    setRequestLoading(true);

    const drData = {
      ...cioRequest,
      itemsLimit: limitValue,
    };

    onSave(drData).then(() => {
      const useCache = !invalidateCache;
      runDataRequest(match.params.projectId, match.params.chartId, dataRequest.id, useCache)
        .then(() => {
          setRequestLoading(false);
        })
        .catch((error) => {
          setRequestLoading(false);
          toast.error("The request failed. Please check your request 🕵️‍♂️");
          setResult(JSON.stringify(error, null, 2));
        });
    });
  };

  const _onUpdateCampaignConfig = (data) => {
    setCioRequest({
      ...cioRequest,
      route: `campaigns/${data.campaignId}/${data.requestRoute}`,
      configuration: {
        ...cioRequest.configuration,
        period: data.period,
        series: data.series,
        steps: data.steps,
        type: data.type && data.type,
        campaignId: data.campaignId,
        requestRoute: data.requestRoute,
        linksMode: data.linksMode,
        selectedLink: data.selectedLink,
        actionId: data.actionId,
        start: data.start,
        end: data.end,
      },
    });
  };

  const _onSavePressed = () => {
    setSaveLoading(true);
    onSave(cioRequest).then(() => {
      setSaveLoading(false);
    }).catch(() => {
      setSaveLoading(false);
    });
  };

  return (
    <div style={styles.container} className="pl-1 pr-1 md:pl-4 md:pr-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-7">
          <Container>
            <Row justify="space-between" align="center">
              <Text b size={"lg"}>{connection.name}</Text>
              <div>
                <Row>
                  <Button
                    color="primary"
                    auto
                    size="sm"
                    onClick={() => _onSavePressed()}
                    isLoading={saveLoading || requestLoading}
                    variant="flat"
                  >
                    {"Save"}
                  </Button>
                  <Spacer x={1} />
                  <Tooltip content="Delete this data request" placement="bottom" css={{ zIndex: 99999 }}>
                    <Button
                      color="danger"
                      isIconOnly
                      auto
                      size="sm"
                      variant="bordered"
                      onClick={() => onDelete()}
                    >
                      <IoTrashBin />
                    </Button>
                  </Tooltip>
                </Row>
              </div>
            </Row>
            <Spacer y={2} />
            <Row>
              <Divider />
            </Row>
            <Spacer y={4} />
            <Row align="center" wrap="wrap">
              <Tabs
                selectedKey={entity}
                onSelectionChange={(key) => {
                  if (key === "customers") {
                    _onSelectCustomers();
                  } else if (key === "campaigns") {
                    _onSelectCampaigns();
                  }
                }}
              >
                <Tab
                  key="customers"
                  title={(
                    <div className="flex items-center space-x-2">
                      <IoPeople />
                      <span>Customers</span>
                    </div>
                  )}
                />
                <Tab
                  key="campaigns"
                  title={(
                    <div className="flex items-center space-x-2">
                      <IoChatboxEllipses />
                      <span>Campaigns</span>
                    </div>
                  )}
                /> 
              </Tabs>
            </Row>

            {!entity && (
              <Row><Text className={"italic"}>Select which type of data you want to get started with</Text></Row>
            )}
            <Spacer y={2} />

            {entity === "customers" && (
              <Row>
                <CustomerQuery
                  conditions={conditions}
                  onUpdateConditions={_onUpdateCustomerConditions}
                  limit={limitValue}
                  onUpdateLimit={(value) => setLimitValue(value)}
                  projectId={project.id}
                  connectionId={connection.id}
                  populateAttributes={
                    cioRequest.configuration && cioRequest.configuration.populateAttributes
                  }
                  onChangeAttributes={() => {
                    setCioRequest({
                      ...cioRequest,
                      configuration: {
                        ...cioRequest.configuration,
                        populateAttributes: !cioRequest.configuration.populateAttributes,
                      }
                    });
                  }}
                />
              </Row>
            )}

            {entity === "campaigns" && (
              <Row>
                <CampaignsQuery
                  projectId={project.id}
                  connectionId={connection.id}
                  onUpdate={_onUpdateCampaignConfig}
                  request={cioRequest}
                />
              </Row>
            )}
          </Container>
        </div>
        <div className="col-span-12 sm:col-span-5">
          <Container>
            <Row className="Customerio-request-tut">
              <Button
                endContent={<IoPlay />}
                isLoading={requestLoading}
                onClick={_onTest}
                className="w-full"
                color="primary"
              >
                Make the request
              </Button>
            </Row>
            <Spacer y={2} />
            <Row align="center">
              <Checkbox
                isSelected={!invalidateCache}
                onChange={() => setInvalidateCache(!invalidateCache)}
                size="sm"
              >
                {"Use cache"}
              </Checkbox>
              <Spacer x={1} />
              <Tooltip
                content="If checked, Chartbrew will use cached data instead of making requests to your data source. The cache gets automatically invalidated when you change the collections and/or filters."
                placement="left-start"
                className="max-w-[500px]"
              >
                <div><IoInformationCircleOutline /></div>
              </Tooltip>
            </Row>
            <Spacer y={2} />
            <Row>
              <div style={{ width: "100%" }}>
                <AceEditor
                  mode="json"
                  theme={isDark ? "one_dark" : "tomorrow"}
                  style={{ borderRadius: 10 }}
                  height="450px"
                  width="none"
                  value={result || ""}
                  name="resultEditor"
                  readOnly
                  editorProps={{ $blockScrolling: false }}
                  className="Customerio-result-tut"
                />
              </div>
            </Row>
            <Spacer y={1} />
            <Row align="center">
              <IoInformationCircleOutline />
              <Spacer x={1} />
              <Text size="sm">
                {"To keep the interface fast, not all the data might show up here."}
              </Text>
            </Row>
          </Container>
        </div>
      </div>
    </div>
  );
}
const styles = {
  container: {
    flex: 1,
  },
};

CustomerioBuilder.defaultProps = {
  dataRequest: null,
};

CustomerioBuilder.propTypes = {
  connection: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  onChangeRequest: PropTypes.func.isRequired,
  runDataRequest: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  responses: PropTypes.array.isRequired,
  dataRequest: PropTypes.object,
  changeTutorial: PropTypes.func.isRequired,
  project: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  return {
    responses: state.dataRequest.responses,
    project: state.project.active,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    runDataRequest: (projectId, chartId, drId, getCache) => {
      return dispatch(runDataRequestAction(projectId, chartId, drId, getCache));
    },
    changeTutorial: (tutorial) => dispatch(changeTutorialAction(tutorial)),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(CustomerioBuilder));
