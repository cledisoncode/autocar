import {
  useRef,
  useState,
} from 'react';

import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  AppHeader,
} from '@/components/app-header';

import {
  type Atendimento,
  useAppData,
} from '@/contexts/app-data-context';

type Aba =
  | 'novo'
  | 'historico';

type FiltroHistorico =
  | 'hoje'
  | 'mes'
  | 'todos';

export default function AtendimentoScreen() {
  const [
    aba,
    setAba,
  ] = useState<Aba>('novo');

  const [
    filtroHistorico,
    setFiltroHistorico,
  ] =
    useState<FiltroHistorico>(
      'todos'
    );

  const [
    busca,
    setBusca,
  ] = useState('');

  const [
    nome,
    setNome,
  ] = useState('');

  const [
    carro,
    setCarro,
  ] = useState('');

  const [
    placa,
    setPlaca,
  ] = useState('');

  const [
    servico,
    setServico,
  ] = useState('');

  const [
    data,
    setData,
  ] = useState('');

  const [
    horario,
    setHorario,
  ] = useState('');

  const [
    valor,
    setValor,
  ] = useState('');

  /*
    Referências dos campos.

    Elas permitem avançar
    de um campo para o outro
    sem fechar o teclado.
  */
  const nomeRef =
    useRef<TextInput>(
      null
    );

  const carroRef =
    useRef<TextInput>(
      null
    );

  const placaRef =
    useRef<TextInput>(
      null
    );

  const servicoRef =
    useRef<TextInput>(
      null
    );

  const dataRef =
    useRef<TextInput>(
      null
    );

  const horarioRef =
    useRef<TextInput>(
      null
    );

  const valorRef =
    useRef<TextInput>(
      null
    );

  const scrollRef =
    useRef<ScrollView>(
      null
    );

  const {
    atendimentos,
    adicionarAtendimento,
  } = useAppData();

  function formatarData(
    texto: string
  ) {
    const numeros =
      texto
        .replace(/\D/g, '')
        .slice(0, 8);

    if (
      numeros.length <= 2
    ) {
      return numeros;
    }

    if (
      numeros.length <= 4
    ) {
      return `${numeros.slice(
        0,
        2
      )}/${numeros.slice(2)}`;
    }

    return `${numeros.slice(
      0,
      2
    )}/${numeros.slice(
      2,
      4
    )}/${numeros.slice(4)}`;
  }

  function formatarHorario(
    texto: string
  ) {
    const numeros =
      texto
        .replace(/\D/g, '')
        .slice(0, 4);

    if (
      numeros.length <= 2
    ) {
      return numeros;
    }

    return `${numeros.slice(
      0,
      2
    )}:${numeros.slice(2)}`;
  }

  function formatarMoeda(
    texto: string
  ) {
    let valorLimpo =
      texto
        .replace(
          'R$',
          ''
        )
        .trim();

    valorLimpo =
      valorLimpo.replace(
        /[^\d,]/g,
        ''
      );

    const partes =
      valorLimpo.split(',');

    let inteiro =
      partes[0] || '';

    if (
      inteiro.length > 1
    ) {
      inteiro =
        inteiro.replace(
          /^0+/,
          ''
        ) || '0';
    }

    if (
      partes.length > 1
    ) {
      const centavos =
        partes[1].slice(
          0,
          2
        );

      return `R$ ${inteiro},${centavos}`;
    }

    return `R$ ${inteiro}`;
  }

  function converterMoeda(
    texto: string
  ) {
    const numero =
      texto
        .replace(
          'R$',
          ''
        )
        .replace(
          /\./g,
          ''
        )
        .replace(
          ',',
          '.'
        )
        .trim();

    return (
      Number(numero) ||
      0
    );
  }

  function converterData(
    dataTexto: string
  ): Date | null {
    if (!dataTexto) {
      return null;
    }

    const partes =
      dataTexto.split('/');

    if (
      partes.length !== 3
    ) {
      return null;
    }

    const dia =
      Number(
        partes[0]
      );

    const mes =
      Number(
        partes[1]
      );

    const ano =
      Number(
        partes[2]
      );

    if (
      !Number.isFinite(
        dia
      ) ||
      !Number.isFinite(
        mes
      ) ||
      !Number.isFinite(
        ano
      )
    ) {
      return null;
    }

    const dataConvertida =
      new Date(
        ano,
        mes - 1,
        dia
      );

    if (
      dataConvertida.getFullYear() !==
        ano ||
      dataConvertida.getMonth() !==
        mes - 1 ||
      dataConvertida.getDate() !==
        dia
    ) {
      return null;
    }

    dataConvertida.setHours(
      0,
      0,
      0,
      0
    );

    return dataConvertida;
  }

  function dataValida(
    dataTexto: string
  ) {
    return (
      converterData(
        dataTexto
      ) !== null
    );
  }

  function horarioValido(
    horarioTexto: string
  ) {
    if (
      horarioTexto.length !==
      5
    ) {
      return false;
    }

    const [
      hora,
      minuto,
    ] =
      horarioTexto
        .split(':')
        .map(Number);

    return (
      hora >= 0 &&
      hora <= 23 &&
      minuto >= 0 &&
      minuto <= 59
    );
  }

  function mesmoDia(
    data1: Date,
    data2: Date
  ) {
    return (
      data1.getDate() ===
        data2.getDate() &&
      data1.getMonth() ===
        data2.getMonth() &&
      data1.getFullYear() ===
        data2.getFullYear()
    );
  }

  function estaNoMesAtual(
    dataAtendimento: Date,
    referencia: Date
  ) {
    return (
      dataAtendimento.getMonth() ===
        referencia.getMonth() &&
      dataAtendimento.getFullYear() ===
        referencia.getFullYear()
    );
  }

  function obterValorAtendimento(
    atendimento: {
      valor?: number;
      valorFinal?: number;
    }
  ) {
    const valorAtual =
      Number(
        atendimento.valor
      );

    if (
      Number.isFinite(
        valorAtual
      )
    ) {
      return valorAtual;
    }

    const valorAntigo =
      Number(
        atendimento.valorFinal
      );

    if (
      Number.isFinite(
        valorAntigo
      )
    ) {
      return valorAntigo;
    }

    return 0;
  }

  function formatarValor(
    numero: number
  ) {
    if (
      !Number.isFinite(
        numero
      )
    ) {
      return '0,00';
    }

    return numero
      .toFixed(2)
      .replace(
        '.',
        ','
      );
  }

  function atendimentoNoPeriodo(
    atendimento: Atendimento
  ) {
    if (
      filtroHistorico ===
      'todos'
    ) {
      return true;
    }

    const dataAtendimento =
      converterData(
        atendimento.data
      );

    if (
      !dataAtendimento
    ) {
      return false;
    }

    const hoje =
      new Date();

    hoje.setHours(
      0,
      0,
      0,
      0
    );

    if (
      filtroHistorico ===
      'hoje'
    ) {
      return mesmoDia(
        dataAtendimento,
        hoje
      );
    }

    return estaNoMesAtual(
      dataAtendimento,
      hoje
    );
  }

  function atendimentoNaBusca(
    atendimento: Atendimento
  ) {
    if (
      filtroHistorico !==
      'todos'
    ) {
      return true;
    }

    const textoBusca =
      busca
        .trim()
        .toLowerCase();

    if (!textoBusca) {
      return true;
    }

    return (
      atendimento.nome
        .toLowerCase()
        .includes(
          textoBusca
        ) ||

      atendimento.carro
        .toLowerCase()
        .includes(
          textoBusca
        ) ||

      atendimento.placa
        .toLowerCase()
        .includes(
          textoBusca
        )
    );
  }

  const atendimentosFiltrados =
    atendimentos.filter(
      (atendimento) =>
        atendimentoNoPeriodo(
          atendimento
        ) &&
        atendimentoNaBusca(
          atendimento
        )
    );

  function rolarParaBaixo() {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true,
      });
    }, 180);
  }

  function limparFormulario() {
    setNome('');

    setCarro('');

    setPlaca('');

    setServico('');

    setData('');

    setHorario('');

    setValor('');
  }

  function salvarAtendimento() {
    Keyboard.dismiss();

    const valorNumero =
      converterMoeda(
        valor
      );

    if (
      !nome ||
      !carro ||
      !placa ||
      !servico ||
      !data ||
      !horario ||
      !valor
    ) {
      Alert.alert(
        'Atenção',
        'Preencha todos os campos.'
      );

      return;
    }

    if (
      !dataValida(
        data
      )
    ) {
      Alert.alert(
        'Data inválida',
        'Informe uma data válida.'
      );

      return;
    }

    if (
      !horarioValido(
        horario
      )
    ) {
      Alert.alert(
        'Horário inválido',
        'Informe um horário válido.'
      );

      return;
    }

    if (
      valorNumero <= 0
    ) {
      Alert.alert(
        'Valor inválido',
        'Informe o valor do serviço.'
      );

      return;
    }

    const novoAtendimento:
      Atendimento = {
      id: Date.now(),

      nome,

      carro,

      placa,

      servico,

      data,

      horario,

      valor:
        valorNumero,
    };

    adicionarAtendimento(
      novoAtendimento
    );

    limparFormulario();

    setFiltroHistorico(
      'todos'
    );

    setBusca('');

    setAba(
      'historico'
    );

    Alert.alert(
      'AUTOCAR',
      'Atendimento adicionado.'
    );
  }

  function selecionarFiltro(
    filtro: FiltroHistorico
  ) {
    setFiltroHistorico(
      filtro
    );

    if (
      filtro !==
      'todos'
    ) {
      setBusca('');
    }
  }

  function tituloContador() {
    if (
      filtroHistorico ===
      'hoje'
    ) {
      return (
        'Atendimentos hoje'
      );
    }

    return (
      'Atendimentos no mês'
    );
  }

  return (
    <KeyboardAvoidingView
      style={
        styles.keyboardContainer
      }
      behavior={
        Platform.OS ===
        'ios'
          ? 'padding'
          : 'height'
      }
    >
      <ScrollView
        ref={scrollRef}
        style={
          styles.container
        }
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={
          false
        }
      >
        <AppHeader />

        <View
          style={
            styles.abas
          }
        >
          <TouchableOpacity
            style={[
              styles.abaButton,

              aba ===
                'novo' &&
                styles.abaAtiva,
            ]}
            onPress={() => {
              Keyboard.dismiss();

              setAba(
                'novo'
              );
            }}
          >
            <Text
              style={[
                styles.abaText,

                aba ===
                  'novo' &&
                  styles.abaTextAtiva,
              ]}
            >
              Novo atendimento
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.abaButton,

              aba ===
                'historico' &&
                styles.abaAtiva,
            ]}
            onPress={() => {
              Keyboard.dismiss();

              setAba(
                'historico'
              );
            }}
          >
            <Text
              style={[
                styles.abaText,

                aba ===
                  'historico' &&
                  styles.abaTextAtiva,
              ]}
            >
              Histórico
            </Text>
          </TouchableOpacity>
        </View>

        {aba ===
          'novo' && (
          <>
            <Text
              style={
                styles.label
              }
            >
              Nome
            </Text>

            <TextInput
              ref={
                nomeRef
              }
              style={
                styles.input
              }
              value={
                nome
              }
              onChangeText={
                setNome
              }
              placeholder="Nome do cliente"
              placeholderTextColor="#777777"
              autoCapitalize="words"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => {
                carroRef.current?.focus();
              }}
            />

            <Text
              style={
                styles.label
              }
            >
              Carro
            </Text>

            <TextInput
              ref={
                carroRef
              }
              style={
                styles.input
              }
              value={
                carro
              }
              onChangeText={
                setCarro
              }
              placeholder="Modelo do carro"
              placeholderTextColor="#777777"
              autoCapitalize="words"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => {
                placaRef.current?.focus();
              }}
            />

            <Text
              style={
                styles.label
              }
            >
              Placa
            </Text>

            <TextInput
              ref={
                placaRef
              }
              style={
                styles.input
              }
              value={
                placa
              }
              onChangeText={(
                texto
              ) => {
                setPlaca(
                  texto
                    .toUpperCase()
                    .slice(
                      0,
                      7
                    )
                );
              }}
              placeholder="ABC1D23"
              placeholderTextColor="#777777"
              autoCapitalize="characters"
              autoCorrect={
                false
              }
              maxLength={7}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => {
                servicoRef.current?.focus();
              }}
            />

            <Text
              style={
                styles.label
              }
            >
              Serviço
            </Text>

            <TextInput
              ref={
                servicoRef
              }
              style={
                styles.input
              }
              value={
                servico
              }
              onChangeText={
                setServico
              }
              placeholder="Lavagem completa"
              placeholderTextColor="#777777"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => {
                dataRef.current?.focus();
              }}
            />

            <Text
              style={
                styles.label
              }
            >
              Data
            </Text>

            <TextInput
              ref={
                dataRef
              }
              style={
                styles.input
              }
              value={
                data
              }
              onChangeText={(
                texto
              ) => {
                setData(
                  formatarData(
                    texto
                  )
                );
              }}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#777777"
              keyboardType="numeric"
              maxLength={10}
              returnKeyType="next"
              submitBehavior="submit"
              onFocus={
                rolarParaBaixo
              }
              onSubmitEditing={() => {
                horarioRef.current?.focus();
              }}
            />

            <Text
              style={
                styles.label
              }
            >
              Horário de chegada
            </Text>

            <TextInput
              ref={
                horarioRef
              }
              style={
                styles.input
              }
              value={
                horario
              }
              onChangeText={(
                texto
              ) => {
                setHorario(
                  formatarHorario(
                    texto
                  )
                );
              }}
              placeholder="HH:MM"
              placeholderTextColor="#777777"
              keyboardType="numeric"
              maxLength={5}
              returnKeyType="next"
              submitBehavior="submit"
              onFocus={
                rolarParaBaixo
              }
              onSubmitEditing={() => {
                valorRef.current?.focus();
              }}
            />

            <Text
              style={
                styles.label
              }
            >
              Valor do serviço
            </Text>

            <TextInput
              ref={
                valorRef
              }
              style={
                styles.input
              }
              value={
                valor
              }
              onFocus={() => {
                if (!valor) {
                  setValor(
                    'R$ '
                  );
                }

                rolarParaBaixo();
              }}
              onChangeText={(
                texto
              ) => {
                setValor(
                  formatarMoeda(
                    texto
                  )
                );
              }}
              placeholder="R$ 0,00"
              placeholderTextColor="#777777"
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={
                salvarAtendimento
              }
            />

            <TouchableOpacity
              style={
                styles.button
              }
              onPress={
                salvarAtendimento
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.buttonText
                }
              >
                SALVAR ATENDIMENTO
              </Text>
            </TouchableOpacity>
          </>
        )}

        {aba ===
          'historico' && (
          <>
            <View
              style={
                styles.filtros
              }
            >
              {[
                [
                  'hoje',
                  'Hoje',
                ],

                [
                  'mes',
                  'Mês',
                ],

                [
                  'todos',
                  'Todos',
                ],
              ].map(
                ([
                  valorFiltro,
                  texto,
                ]) => (
                  <TouchableOpacity
                    key={
                      valorFiltro
                    }
                    style={[
                      styles.filtroButton,

                      filtroHistorico ===
                        valorFiltro &&
                        styles.filtroAtivo,
                    ]}
                    onPress={() => {
                      selecionarFiltro(
                        valorFiltro as FiltroHistorico
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.filtroText,

                        filtroHistorico ===
                          valorFiltro &&
                          styles.filtroTextAtivo,
                      ]}
                    >
                      {
                        texto
                      }
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {filtroHistorico !==
              'todos' && (
              <View
                style={
                  styles.contadorCard
                }
              >
                <Text
                  style={
                    styles.contadorTitulo
                  }
                >
                  {
                    tituloContador()
                  }
                </Text>

                <View
                  style={
                    styles.contadorNumeroArea
                  }
                >
                  <Text
                    style={
                      styles.contadorNumero
                    }
                  >
                    {
                      atendimentosFiltrados.length
                    }
                  </Text>
                </View>
              </View>
            )}

            {filtroHistorico ===
              'todos' && (
              <View
                style={
                  styles.buscaArea
                }
              >
                <TextInput
                  style={
                    styles.pesquisaInput
                  }
                  value={
                    busca
                  }
                  onChangeText={
                    setBusca
                  }
                  placeholder="Buscar por nome, carro ou placa"
                  placeholderTextColor="#777777"
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                  }}
                />

                {busca.length >
                  0 && (
                  <TouchableOpacity
                    style={
                      styles.limparBusca
                    }
                    onPress={() => {
                      setBusca('');
                    }}
                  >
                    <Text
                      style={
                        styles.limparBuscaTexto
                      }
                    >
                      ×
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {atendimentosFiltrados.length ===
            0 ? (
              <View
                style={
                  styles.vazio
                }
              >
                <Text
                  style={
                    styles.vazioTitulo
                  }
                >
                  Nenhum atendimento
                </Text>
              </View>
            ) : (
              atendimentosFiltrados.map(
                (
                  atendimento
                ) => (
                  <View
                    key={
                      atendimento.id
                    }
                    style={
                      styles.atendimentoCard
                    }
                  >
                    <View
                      style={
                        styles.cardTopo
                      }
                    >
                      <View
                        style={
                          styles.clienteArea
                        }
                      >
                        <Text
                          style={
                            styles.cliente
                          }
                        >
                          {
                            atendimento.nome
                          }
                        </Text>

                        <Text
                          style={
                            styles.carro
                          }
                        >
                          {
                            atendimento.carro
                          }
                        </Text>

                        <Text
                          style={
                            styles.placa
                          }
                        >
                          {
                            atendimento.placa
                          }
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.valorHistorico
                        }
                      >
                        R${' '}
                        {
                          formatarValor(
                            obterValorAtendimento(
                              atendimento
                            )
                          )
                        }
                      </Text>
                    </View>

                    <View
                      style={
                        styles.divisor
                      }
                    />

                    <Text
                      style={
                        styles.detalhe
                      }
                    >
                      {
                        atendimento.servico
                      }
                    </Text>

                    <Text
                      style={
                        styles.detalhe
                      }
                    >
                      {
                        atendimento.data
                      }
                    </Text>

                    <Text
                      style={
                        styles.detalhe
                      }
                    >
                      {
                        atendimento.horario
                      }
                    </Text>
                  </View>
                )
              )
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
    keyboardContainer: {
      flex: 1,

      backgroundColor:
        '#000000',
    },

    container: {
      flex: 1,

      backgroundColor:
        '#000000',
    },

    content: {
      paddingHorizontal: 20,

      paddingTop: 50,

      paddingBottom: 80,
    },

    abas: {
      flexDirection:
        'row',

      backgroundColor:
        '#1E1E1E',

      borderRadius: 10,

      padding: 4,

      marginBottom: 20,
    },

    abaButton: {
      flex: 1,

      height: 44,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 8,
    },

    abaAtiva: {
      backgroundColor:
        '#E53935',
    },

    abaText: {
      color:
        '#AAAAAA',

      fontSize: 13,

      fontWeight:
        '600',
    },

    abaTextAtiva: {
      color:
        '#FFFFFF',
    },

    label: {
      color:
        '#FFFFFF',

      fontSize: 15,

      marginTop: 15,

      marginBottom: 7,
    },

    input: {
      backgroundColor:
        '#FFFFFF',

      color:
        '#111111',

      height: 50,

      borderRadius: 10,

      paddingHorizontal: 15,

      fontSize: 16,
    },

    button: {
      backgroundColor:
        '#E53935',

      height: 52,

      borderRadius: 10,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop: 30,
    },

    buttonText: {
      color:
        '#FFFFFF',

      fontSize: 15,

      fontWeight:
        '700',
    },

    filtros: {
      flexDirection:
        'row',

      gap: 8,

      marginBottom: 15,
    },

    filtroButton: {
      flex: 1,

      height: 44,

      borderRadius: 9,

      backgroundColor:
        '#1E1E1E',

      borderWidth: 1,

      borderColor:
        '#444444',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    filtroAtivo: {
      backgroundColor:
        '#E53935',

      borderColor:
        '#E53935',
    },

    filtroText: {
      color:
        '#AAAAAA',

      fontSize: 12,

      fontWeight:
        '700',
    },

    filtroTextAtivo: {
      color:
        '#FFFFFF',
    },

    contadorCard: {
      backgroundColor:
        '#1E1E1E',

      borderRadius: 11,

      borderWidth: 1,

      borderColor:
        '#333333',

      padding: 15,

      marginBottom: 15,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    contadorTitulo: {
      color:
        '#FFFFFF',

      fontSize: 15,

      fontWeight:
        '700',
    },

    contadorNumeroArea: {
      minWidth: 43,

      height: 38,

      paddingHorizontal: 10,

      borderRadius: 9,

      backgroundColor:
        '#E53935',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    contadorNumero: {
      color:
        '#FFFFFF',

      fontSize: 18,

      fontWeight:
        '900',
    },

    buscaArea: {
      position:
        'relative',

      marginBottom: 15,
    },

    pesquisaInput: {
      height: 48,

      backgroundColor:
        '#FFFFFF',

      color:
        '#111111',

      borderRadius: 10,

      paddingLeft: 15,

      paddingRight: 45,

      fontSize: 15,
    },

    limparBusca: {
      position:
        'absolute',

      right: 4,

      top: 4,

      width: 40,

      height: 40,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    limparBuscaTexto: {
      color:
        '#555555',

      fontSize: 26,
    },

    vazio: {
      backgroundColor:
        '#1E1E1E',

      borderRadius: 12,

      padding: 25,

      alignItems:
        'center',
    },

    vazioTitulo: {
      color:
        '#FFFFFF',

      fontSize: 16,

      fontWeight:
        '700',
    },

    atendimentoCard: {
      backgroundColor:
        '#1E1E1E',

      borderRadius: 12,

      padding: 16,

      marginBottom: 14,

      borderWidth: 1,

      borderColor:
        '#333333',
    },

    cardTopo: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'flex-start',
    },

    clienteArea: {
      flex: 1,

      marginRight: 10,
    },

    cliente: {
      color:
        '#FFFFFF',

      fontSize: 17,

      fontWeight:
        '700',
    },

    carro: {
      color:
        '#AAAAAA',

      fontSize: 14,

      marginTop: 3,
    },

    placa: {
      color:
        '#AAAAAA',

      fontSize: 14,

      marginTop: 3,
    },

    valorHistorico: {
      color:
        '#E53935',

      fontSize: 18,

      fontWeight:
        '800',
    },

    divisor: {
      height: 1,

      backgroundColor:
        '#333333',

      marginVertical: 12,
    },

    detalhe: {
      color:
        '#BBBBBB',

      fontSize: 14,

      marginBottom: 5,
    },
  });