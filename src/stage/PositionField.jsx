import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Button, Card, Checkbox, Col, Input, Row, Select, Space, Tooltip, InputNumber } from "antd";
import { raceKeys } from "../common/RaceKeys";
import { useImmer } from "use-immer";

const PositionField = forwardRef(function PositionField({ position, constraints }, ref) {
  const [event, setEvent] = useState(position.event);
  const [race, setRace] = useState(position.race);
  const [sex, updateSex] = useImmer(position.sex || {
    male: true,
    female: false,
    futa: false
  });
  const [extra, updateExtra] = useImmer(position.extra || {
    submissive: false,
    optional: false,

    vampire: false,
    dead: false,
  });
  const [offset, updateOffset] = useImmer(position.offset || {
    x: undefined,
    y: undefined,
    z: undefined,
    rot: undefined,
  });



  useImperativeHandle(ref, () => {
    return {
      getData() {

      }
    };
  }, [event, race]);

  function CheckboxEx({ obj, label, disabled, attr, updateFunc }) {
    return (
      <Checkbox
        onChange={(e) => { updateFunc(prev => { prev[attr] = e.target.checked }) }}
        checked={obj[attr] && !disabled}
        disabled={disabled || false}
      >
        {label}
      </Checkbox>
    );
  }

  return (
    <div>
      <Row>
        <Col flex={1}>
          <Card className="position-attribute-card" title={'Race'}>
            <Select
              className='position-race-select'
              defaultValue={race}
              showSearch
              placeholder="Position race"
              optionFilterProp="children"
              filterOption={(input, option) => (option?.label ?? '').includes(input)}
              filterSort={(optionA, optionB) =>
                (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
              }
              options={raceKeys.map((race, i) => { return { value: race, label: race } })}
              onSelect={(e) => { setRace(e) }}
            />
          </Card>
        </Col>
        <Col flex={1}>
          <Card className="position-attribute-card position-base-card" title={"Sex"}
            extra={<Tooltip title={'The sexes compatible with this position. Tick all that apply.'}><Button type="link">Info</Button></Tooltip>}
          >
            <Space size={'large'}>
              <CheckboxEx
                obj={sex}
                label={'Male'}
                attr={'male'}
                updateFunc={updateSex}
              />
              <CheckboxEx
                obj={sex}
                label={'Female'}
                attr={'female'}
                updateFunc={updateSex}
              />
              <CheckboxEx
                obj={sex}
                label={'Futa'}
                disabled={race !== 'Human'}
                attr={'futa'}
                updateFunc={updateSex}
              />
            </Space>
          </Card>
        </Col>
        <Col flex={1}>
          <Card className="position-attribute-card" title={'Animation'}
            extra={<Tooltip title={'The behavior file (.hkx) describing the animation for this position. Without extension.'}><Button type="link">Info</Button></Tooltip>}>
            <Input className="position-behavior-input" addonAfter={'.hkx'}
              value={event} onChange={(e) => { setEvent(e.target.value) }}
              placeholder="Behavior file"
            />
          </Card>
        </Col>
      </Row>
      <Row>
        <Col flex={1}>
          <Card title={'Meta Data'}
            extra={<Tooltip title={'Meta data describing this position. Hover options for more info.'}><Button type="link">Info</Button></Tooltip>}
          >
            <Tooltip title={'Taker/Bottom position of the animation, if any. There may only be 1 submissive position per scene.'}>
              {/* div here is necessary to avoid 'findDOMNode is depreciated' error */}
              <div>
                <CheckboxEx
                  obj={extra}
                  label={'Submissive'}
                  attr={'submissive'}
                  updateFunc={updateExtra}
                />
              </div>
            </Tooltip>
            <Tooltip title={'A position that is not mandatory for the scene to play out correctly.'}>
              <div>
                <CheckboxEx
                  obj={extra}
                  label={'Optional'}
                  attr={'optional'}
                  updateFunc={updateExtra}
                />
              </div>
            </Tooltip>
            <Tooltip title={'The animation assumes the actor to be a vampire.'}>
              <div>
                <CheckboxEx
                  obj={extra}
                  label={'Vampire'}
                  attr={'vampire'}
                  updateFunc={updateExtra}
                />
              </div>
            </Tooltip>
            <Tooltip title={'The actor animated in this position is unconscious/dead.'}>
              <div>
                <CheckboxEx
                  obj={extra}
                  label={'Unconscious'}
                  attr={'dead'}
                  updateFunc={updateExtra}
                />
              </div>
            </Tooltip>
          </Card>
        </Col>
        <Col flex={1}>
          <Card title={'Offset'}
            extra={<Tooltip title={'The offset of this actor relative to the center of the animation.'}><Button type="link">Info</Button></Tooltip>}
          >
            <InputNumber addonBefore={'X'} controls decimalSeparator="," precision={1} step={0.1}
              value={offset.x ? offset.x : undefined} onChange={(e) => { updateOffset(prev => { prev.x = e }) }}
              placeholder="0.0" 
            />
            <InputNumber addonBefore={'Y'} controls decimalSeparator="," precision={1} step={0.1}
              value={offset.y ? offset.y : undefined} onChange={(e) => { updateOffset(prev => { prev.y = e }) }}
              placeholder="0.0"
            />
            <InputNumber addonBefore={'Z'} controls decimalSeparator="," precision={1} step={0.1}
              value={offset.z ? offset.z : undefined} onChange={(e) => { updateOffset(prev => { prev.z = e }) }}
              placeholder="0.0"
            />
            <InputNumber addonBefore={'Rot'} controls decimalSeparator="," precision={1} step={0.1} min={0.0} max={359.9}
              value={offset.rot ? offset.rot : undefined} onChange={(e) => { updateOffset(prev => { prev.rot = e }) }}
              placeholder="0.0"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
});

export default PositionField;
