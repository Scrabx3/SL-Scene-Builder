import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Button, Card, Checkbox, Col, Input, Row, Select, Space, Tooltip, InputNumber } from "antd";
import { raceKeys } from "../common/RaceKeys";
import { useImmer } from "use-immer";
import './PositionField.css'

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
  const [scale, setScale] = useState(position.scal);


  useImperativeHandle(ref, () => {
    return {
      getData() {
        return {
          event,
          race,
          sex,
          extra,
          offset,
        };
      }
    };
  }, [event, race, sex, extra, offset]);

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
      <Row gutter={[2, 2]}>
        <Col span={8}>
          {/* Race */}
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
        <Col span={8}>
          {/* Sex */}
          <Card className="position-attribute-card" title={"Sex"}
            extra={<Tooltip title={'The sexes compatible with this position. Tick all that apply.'}><Button type="link">Info</Button></Tooltip>}
          >
            <Space size={'large'}>
              <CheckboxEx obj={sex} label={'Male'} attr={'male'} updateFunc={updateSex} />
              <CheckboxEx obj={sex} label={'Female'} attr={'female'} updateFunc={updateSex} />
              <CheckboxEx obj={sex} label={'Futa'} disabled={race !== 'Human'} attr={'futa'} updateFunc={updateSex} />
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          {/* behavior file */}
          <Card className="position-attribute-card" title={'Animation'}
            extra={<Tooltip title={'The behavior file (.hkx) describing the animation for this position. Without extension.'}><Button type="link">Info</Button></Tooltip>}>
            <Input addonAfter={'.hkx'}
              value={event} onChange={(e) => { setEvent(e.target.value) }}
              placeholder="Behavior file"
            />
          </Card>
        </Col>

        <Col span={12}>
          {/* Data */}
          <Card className="position-attribute-card" title={'Data'}
            extra={<Tooltip title={'Data describing this position. Hover options for more info.'}><Button type="link">Info</Button></Tooltip>}
          >
            {/* div here is necessary to avoid 'findDOMNode is depreciated' error */}
            <Row gutter={[8, 16]} justify={'space-between'}>
              <Col>
                <Tooltip title={'Taker/Bottom position of the animation, if any.'}>
                  <div>
                    <CheckboxEx obj={extra} label={'Submissive'} attr={'submissive'} updateFunc={updateExtra} />
                  </div>
                </Tooltip>
              </Col>
              <Col>
                <Tooltip title={'If this actor climaxes in this stage.'}>
                  <div>
                    <CheckboxEx obj={extra} label={'Climax'} attr={'climax'} updateFunc={updateExtra} />
                  </div>
                </Tooltip>
              </Col>
              <Col>
                <Tooltip title={'The animation assumes the actor to be a vampire.'}>
                  <div>
                    <CheckboxEx obj={extra} label={'Vampire'} attr={'vampire'} updateFunc={updateExtra} />
                  </div>
                </Tooltip>
              </Col>
              <Col>
                <Tooltip title={'The actor animated in this position is unconscious/dead.'}>
                  <div>
                    <CheckboxEx obj={extra} label={'Unconscious'} attr={'dead'} updateFunc={updateExtra} />
                  </div>
                </Tooltip>
              </Col>
              <Col>
                <Tooltip title={'A position that is not mandatory for the scene to play out correctly.'}>
                  <div>
                    <CheckboxEx obj={extra} label={'Optional'} attr={'optional'} updateFunc={updateExtra} />
                  </div>
                </Tooltip>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          {/* Offset */}
          <Card className="position-attribute-card" title={'Offset'}
            extra={<Tooltip title={'The offset of this actor relative to the center of the animation.'}><Button type="link">Info</Button></Tooltip>}
          >
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <InputNumber addonBefore={'X'} controls decimalSeparator="," precision={1} step={0.1}
                  value={offset.x ? offset.x : undefined} onChange={(e) => { updateOffset(prev => { prev.x = e }) }}
                  placeholder="0.0"
                />
              </Col>
              <Col span={12}>
                <InputNumber addonBefore={'Y'} controls decimalSeparator="," precision={1} step={0.1}
                  value={offset.y ? offset.y : undefined} onChange={(e) => { updateOffset(prev => { prev.y = e }) }}
                  placeholder="0.0"
                />
              </Col>
              <Col span={12}>
                <InputNumber addonBefore={'Z'} controls decimalSeparator="," precision={1} step={0.1}
                  value={offset.z ? offset.z : undefined} onChange={(e) => { updateOffset(prev => { prev.z = e }) }}
                  placeholder="0.0"
                />
              </Col>
              <Col span={12}>
                <InputNumber addonBefore={'°'} controls decimalSeparator="," precision={1} step={0.1} min={0.0} max={359.9}
                  value={offset.rot ? offset.rot : undefined} onChange={(e) => { updateOffset(prev => { prev.rot = e }) }}
                  placeholder="0.0"
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="position-attribute-card" title={'Scale'}
            extra={<Tooltip title={'This positions scale info'}><Button type="link">Info</Button></Tooltip>}
          >
            <InputNumber addonBefore={'Factor'} controls decimalSeparator=","
              precision={2} min={0.5} max={1.9} step={0.01}
              value={scale} onChange={(e) => { setScale(e) }}
              placeholder="1.0"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
});

export default PositionField;
